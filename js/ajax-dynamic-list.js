function IsNumeric(sText) {
	sText = sText + '';
	return /^[0-9]+?$/g.test(sText);
}
/************************************************************************************************************
 Ajax dynamic list
 Copyright (C) 2006  DTHMLGoodies.com, Alf Magne Kalleland

 This library is free software; you can redistribute it and/or
 modify it under the terms of the GNU Lesser General Public
 License as published by the Free Software Foundation; either
 version 2.1 of the License, or (at your option) any later version.

 This library is distributed in the hope that it will be useful,
 but WITHOUT ANY WARRANTY; without even the implied warranty of
 MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
 Lesser General Public License for more details.

 You should have received a copy of the GNU Lesser General Public
 License along with this library; if not, write to the Free Software
 Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA  02110-1301  USA

 Dhtmlgoodies.com., hereby disclaims all copyright interest in this script
 written by Alf Magne Kalleland.

 Alf Magne Kalleland, April 2006
 Owner of DHTMLgoodies.com


 ************************************************************************************************************/

window.buddy = window['buddy'] || {};

buddy.AjaxDynamicList = new Class({
	Extends:Events,

	ajaxBox_offsetX:0,
	ajaxBox_offsetY:0,
	url:'/zip/include/ZipCitiesArray.php',
	// Path to external file
	minimumLettersBeforeLookup:1, // Number of letters entered before a lookup is performed.

	ajax_list_objects:[],
	cache:[],
	ajax_list_activeInput:undefined,
	activeListItem:undefined,
	ajax_list_optionDivFirstItem:false,
	ajax_list_currentLetters:[],
	ajax_optionDiv:undefined,
	ajax_optionDiv_iframe:undefined,

	ajax_list_MSIE:(navigator.userAgent.indexOf('MSIE') >= 0 && navigator.userAgent.indexOf('Opera') < 0),

	currentListIndex:0,


	getTop:function (inputObj) {

		var returnValue = inputObj.offsetTop;
		while ((inputObj = inputObj.offsetParent) != null) {
			returnValue += inputObj.offsetTop;
		}
		return returnValue;
	},

	ajax_list_cancelEvent:function () {
		return false;
	},

	getLeft:function (inputObj) {
		var returnValue = inputObj.offsetLeft;
		while ((inputObj = inputObj.offsetParent) != null)returnValue += inputObj.offsetLeft;

		return returnValue;
	},

	ajax_option_setValue:function (e) {
		var inputObj = e.target;
		var tmpValue = inputObj.innerHTML;

		if (this.ajax_list_MSIE)tmpValue = inputObj.innerText; else tmpValue = inputObj.textContent;
		if (!tmpValue)tmpValue = inputObj.innerHTML;

		this.ajax_list_activeInput.value = tmpValue;
		if (document.getElementById(this.ajax_list_activeInput.name + '_hidden'))document.getElementById(this.ajax_list_activeInput.name + '_hidden').value = inputObj.id;


		this.ajax_options_hide();
	},

	ajax_options_hide:function () {
		if (this.ajax_optionDiv)this.ajax_optionDiv.style.display = 'none';
		if (this.ajax_optionDiv_iframe)this.ajax_optionDiv_iframe.style.display = 'none';
	},

	ajax_options_rollOverActiveItem:function (item, fromKeyBoard) {
		if (!fromKeyBoard)item = item.target;

		if (this.activeListItem)this.activeListItem.className = 'optionDiv';
		item.className = 'optionDivSelected';
		this.activeListItem = item;

		if (fromKeyBoard) {
			if (this.activeListItem.offsetTop > this.ajax_optionDiv.offsetHeight) {
				this.ajax_optionDiv.scrollTop = this.activeListItem.offsetTop - this.ajax_optionDiv.offsetHeight + this.activeListItem.offsetHeight + 2;
			}
			if (this.activeListItem.offsetTop < this.ajax_optionDiv.scrollTop) {
				this.ajax_optionDiv.scrollTop = 0;
			}
		}
	},

	populateList:function (letters, param) {
		this.ajax_optionDiv.innerHTML = '';
		this.activeListItem = false;
		if (this.cache[param][letters.toLowerCase()].length <= 1) {
			this.ajax_options_hide();
			return;
		}

		this.ajax_list_optionDivFirstItem = false;
		var optionsAdded = false;
		for (var no = 0; no < this.cache[param][letters.toLowerCase()].length; no++) {
			if (this.cache[param][letters.toLowerCase()][no].length == 0)continue;
			optionsAdded = true;
			var div = document.createElement('DIV');
			var items = this.cache[param][letters.toLowerCase()][no].split(/###/gi);

			if (this.cache[param][letters.toLowerCase()].length == 1 && this.ajax_list_activeInput.value == items[0]) {
				this.ajax_options_hide();
				return;
			}


			div.innerHTML = items[items.length - 1];
			div.id = items[0];
			div.className = 'optionDiv';
			div.addEvent('mouseenter', this.ajax_options_rollOverActiveItem.bind(this));
			div.addEvent('click', this.ajax_option_setValue.bind(this));

			if (!this.ajax_list_optionDivFirstItem)this.ajax_list_optionDivFirstItem = div;
			this.ajax_optionDiv.appendChild(div);
		}
		if (optionsAdded) {
			this.ajax_optionDiv.style.display = 'block';
			if (this.ajax_optionDiv_iframe)this.ajax_optionDiv_iframe.style.display = '';
			this.ajax_options_rollOverActiveItem(this.ajax_list_optionDivFirstItem, true);
		}

	},

	receiveServerResponse:function (content, inputObj, param, whichIndex) {
		if (whichIndex != this.currentListIndex)return;
		var letters = inputObj.value;

		var elements = content.split('|');

		if (elements.length == 1 && elements[0].substr(0, 3) != "Not") // (BL) If there is only one item, and it matches, put it in the input box
		{
			if (IsNumeric(inputObj.value)) {
				inputObj.value = elements[0].substr(6);
			} //(BL)
			else {
				inputObj.value = elements[0].substr(6);
			} // (BL)
		}
		// ----------------------------------- //

		this.cache[param][letters.toLowerCase()] = elements;
		this.populateList(letters, param);
	},

	onResize:function (inputObj) {
		this.ajax_optionDiv.style.top = (this.getTop(inputObj) + inputObj.offsetHeight + this.ajaxBox_offsetY) + 'px';
		this.ajax_optionDiv.style.left = (this.getLeft(inputObj) + this.ajaxBox_offsetX) + 'px';
		if (this.ajax_optionDiv_iframe) {
			this.ajax_optionDiv_iframe.style.left = this.ajax_optionDiv.style.left;
			this.ajax_optionDiv_iframe.style.top = this.ajax_optionDiv.style.top;
		}

	},

	initialize:function (config) {
		config = config || {};
		this.url = config.url || this.url;

		document.documentElement.addEvent('click', this.autoHideList.bind(this));


	},

	createIframe:function () {

		if (this.ajax_list_MSIE && !this.ajax_optionDiv_iframe) {
			this.ajax_optionDiv_iframe = document.createElement('IFRAME');
			this.ajax_optionDiv_iframe.border = '0';
			this.ajax_optionDiv_iframe.style.width = this.ajax_optionDiv.clientWidth + 'px';
			this.ajax_optionDiv_iframe.style.height = this.ajax_optionDiv.clientHeight + 'px';
			this.ajax_optionDiv_iframe.id = '_listOfOptions_iframe'; // (BL) replaced "ajax" with Source variable
			document.body.appendChild(this.ajax_optionDiv_iframe);
		}

	},

	params:{},

	/**
	 Add new input
	 @param {String|HTMLElement} field
	 @param {String} param
	 @example
		 var list = new buddy.AjaxDynamicList({
			 url : 'ajax-list-countries.php'
		 });
		 list.add('country', 'getCountriesByLetters');
		 list.add('country2', 'getCountriesByLetters');
		 list.add('city', 'getCity');
	 where "country", "country2" and "city" are id's of <input> fields. "getCountriesByLetters" is the parameter sent to the server with the request.
	 */
	add:function (field, param) {
		field = document.id(field);

		field.id = field.id || ('ajax-list-input-' + Math.random()).replace(/\./g, '');

		field.addEvent('focus', this.showList.bind(this));
		field.addEvent('keyup', this.showList.bind(this));

		field.autocomplete = "off";

		this.params[field.id] = param;
	},

	createOptionContainer:function () {
		this.ajax_optionDiv = document.createElement('DIV');
		this.ajax_optionDiv.id = 'ajax_listOfOptions'; // (BL) replaced "ajax" with Source variable
		document.body.appendChild(this.ajax_optionDiv);

		var allInputs = document.getElementsByTagName('INPUT');
		for (var no = 0; no < allInputs.length; no++) {
			document.id(allInputs[no]).addEvent('focus', this.ajax_options_hide);
		}
		var allSelects = document.getElementsByTagName('SELECT');
		for (no = 0; no < allSelects.length; no++) {
			document.id(allSelects[no]).addEvent('focus', this.ajax_options_hide);
		}

		document.body.addEvent('keydown', this.keyNav.bind(this));
		document.body.addEvent('resize', this.onResize.bind(this));
	},

	showList:function (e)//(BL) Source added
	{
		inputObj = e.target;
		param = this.params[e.target.id];

		this.ajax_list_activeInput = inputObj;

		if (e.keyCode == 13 || e.keyCode == 9)return;
		if (this.ajax_list_currentLetters[inputObj.name] == inputObj.value)return;
		this.cache[param] = []; // (BL) At one point, the line below was causing problems with numeric (zip code) entries. Believe solved.
		if (!this.cache[param])this.cache[param] = [];
		this.ajax_list_currentLetters[inputObj.name] = inputObj.value;
		if (!this.ajax_optionDiv) { 
			this.createOptionContainer();
		}

		if (inputObj.value.length < this.minimumLettersBeforeLookup) {
			this.ajax_options_hide();
			return;
		}

		this.ajax_optionDiv.style.top = (this.getTop(inputObj) + inputObj.offsetHeight + this.ajaxBox_offsetY) + 'px';
		this.ajax_optionDiv.style.left = (this.getLeft(inputObj) + this.ajaxBox_offsetX) + 'px';
		if (this.ajax_optionDiv_iframe) {
			this.ajax_optionDiv_iframe.style.left = this.ajax_optionDiv.style.left;
			this.ajax_optionDiv_iframe.style.top = this.ajax_optionDiv.style.top;
		}


		this.ajax_optionDiv.onselectstart = this.ajax_list_cancelEvent;
		this.currentListIndex++;
		if (this.cache[param][inputObj.value.toLowerCase()]) {
			this.populateList(inputObj.value, param, this.currentListIndex);
		} else {
			this.sendRequest(inputObj, param);
		}
	},

	sendRequest:function (field, param) {

		var payload = {};
		payload[param] = 1;
		payload.letters = field.value;
		var index = this.currentListIndex;

		var req = new Request({
			url:this.url,
			data:payload,

			onComplete:function (text) {
				this.receiveServerResponse(text, field, param, index);
			}.bind(this)
		});
		req.send();
	},

	keyNav:function (e) {
		if (document.all)e = event;

		if (!this.ajax_optionDiv)return undefined;
		if (this.ajax_optionDiv.style.display == 'none')return undefined;

		if (e.key == 'up') {    // Up arrow
			if (!this.activeListItem)return undefined;
			if (this.activeListItem && !this.activeListItem.previousSibling)return undefined;
			this.ajax_options_rollOverActiveItem(this.activeListItem.previousSibling, true);
		}

		if (e.key == 'down') {    // Down arrow
			if (!this.activeListItem) {
				this.ajax_options_rollOverActiveItem(this.ajax_list_optionDivFirstItem, true);
			} else {
				if (!this.activeListItem.nextSibling)return undefined;
				this.ajax_options_rollOverActiveItem(this.activeListItem.nextSibling, true);
			}
		}

		if (e.key == 'enter' || e.key == 'tab') {    // Enter key or tab key
			if (this.activeListItem && this.activeListItem.className == 'optionDivSelected') {
				this.ajax_option_setValue({ target:this.activeListItem });
			}
			this.ajax_options_hide();
			if (e.key == 'enter') {
				this.ajax_list_activeInput.blur();
			}
			return e.key != 'enter';
		}

		if (e.key == 'esc') {    // Escape key
			this.ajax_options_hide();
		}

		return undefined;
	},

	autoHideList:function (e) {
		var source = e.target;
		if (source.tagName.toLowerCase() != 'input' && source.tagName.toLowerCase() != 'textarea')this.ajax_options_hide();
	}
});

