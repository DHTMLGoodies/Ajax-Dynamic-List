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
	activeInput:undefined,
	activeListItem:undefined,
	ajax_list_optionDivFirstItem:false,
	currentLetters:[],
	listContainer:{},
	listContainer_iframe:undefined,

	delay:0.3,

	isMSIE:(navigator.userAgent.indexOf('MSIE') >= 0 && navigator.userAgent.indexOf('Opera') < 0),

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

	setValueFromEl:function (e) {
		var inputObj = e.target || e;
		var val = inputObj.innerHTML;
		if (this.isMSIE)val = inputObj.innerText; else val = inputObj.textContent;
		if (!val)val = inputObj.innerHTML;

		this.activeInput.value = val;
		if (document.getElementById(this.activeInput.name + '_hidden')){
			document.getElementById(this.activeInput.name + '_hidden').value = inputObj.id;
		}

		this.ajax_options_hide();

		this.fireEvent('change', [val, inputObj]);
	},

	ajax_options_hide:function () {

		if (this.activeInput && this.listContainer[this.activeInput.id]){
			this.listContainer[this.activeInput.id].style.display = 'none';
		}
		if (this.listContainer_iframe)this.listContainer_iframe.style.display = 'none';
	},

	ajax_options_rollOverActiveItem:function (item, fromKeyBoard) {
		if (!fromKeyBoard)item = item.target;

		if (this.activeListItem)this.activeListItem.className = 'optionDiv';
		item.className = 'optionDivSelected';
		this.activeListItem = item;

		if (fromKeyBoard) {
			if (this.activeListItem.offsetTop > this.listContainer[this.activeInput.id].offsetHeight) {
				this.listContainer[this.activeInput.id].scrollTop = this.activeListItem.offsetTop - this.listContainer[this.activeInput.id].offsetHeight + this.activeListItem.offsetHeight + 2;
			}
			if (this.activeListItem.offsetTop < this.listContainer[this.activeInput.id].scrollTop) {
				this.listContainer[this.activeInput.id].scrollTop = 0;
			}
		}
	},

	populateList:function (letters, param) {

		this.listContainer[this.activeInput.id].innerHTML = '';
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


			if (this.cache[param][letters.toLowerCase()].length == 1 && this.activeInput.value == items[0]) {
				this.ajax_options_hide();
				return;
			}


			div.innerHTML = items[items.length - 1];
			div.id = items[0];
			div.className = 'optionDiv';
			div.addEvent('mouseenter', this.ajax_options_rollOverActiveItem.bind(this));
			div.addEvent('click', this.setValueFromEl.bind(this));

			if (!this.ajax_list_optionDivFirstItem)this.ajax_list_optionDivFirstItem = div;
			this.listContainer[this.activeInput.id].appendChild(div);
		}
		if (optionsAdded) {
			this.displayListContainer();
		}
	},

	displayListContainer:function(){
		this.listContainer[this.activeInput.id].style.display = 'block';
		if (this.listContainer_iframe)this.listContainer_iframe.style.display = '';
		this.ajax_options_rollOverActiveItem(this.ajax_list_optionDivFirstItem, true);

		for(var key in this.listContainer){
			if(this.listContainer.hasOwnProperty(key)){
				if(key != this.activeInput.id){
					this.listContainer[key].style.display='none';
				}
			}
		}
	},

	receiveServerResponse:function (content, inputObj, param, whichIndex) {
		if (whichIndex != this.currentListIndex)return;
		var letters = inputObj.value;


		var elements = content.split('|');
		elements = this.removeEmptyItems(elements);

		if(elements.length == 1){
			elements[0] = elements[0].trim();	// Fix for not found which contained white space(new lines)
		}

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

		this.storeInCache(param,letters, elements);
		this.populateList(letters, param);
	},

	storeInCache:function(param, letters, elements){
		this.cache[param][letters.toLowerCase()] = elements;
	},

	removeEmptyItems:function(items){
		if(items.length > 0 && items[items.length-1] == ''){
			items.pop();
		}
		return items;
	},

	onResize:function (inputObj) {

		var c = this.listContainer[this.activeInput.id];
		c.style.top = (this.getTop(inputObj) + inputObj.offsetHeight + this.ajaxBox_offsetY) + 'px';
		c.style.left = (this.getLeft(inputObj) + this.ajaxBox_offsetX) + 'px';
		var i = this.listContainer_iframe;
		if (i) {
			i.style.left = c.style.left;
			i.style.top = c.style.top;
		}

	},

	initialize:function (config) {
		config = config || {};
		this.url = config.url || this.url;

		document.documentElement.addEvent('click', this.autoHideList.bind(this));


	},

	createIframe:function () {

		if (this.isMSIE && !this.listContainer_iframe) {
			var i = this.listContainer_iframe = document.createElement('IFRAME');
			i.border = '0';
			i.style.width = this.listContainer[this.activeInput.id].clientWidth + 'px';
			i.style.height = this.listContainer[this.activeInput.id].clientHeight + 'px';
			i.className='listContainerIFrame';
			i.id = '_listOfOptions_iframe'; // (BL) replaced "ajax" with Source variable
			i.style.position='absolute';
			document.body.appendChild(i);
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
		field.addEvent('keyup', this.keySearch.bind(this));

		field.autocomplete = "off";

		this.params[field.id] = param;
	},

	createOptionContainer:function () {

		var c = this.listContainer[this.activeInput.id] = document.createElement('DIV');

		c.id = 'ajax_listOfOptions'; // (BL) replaced "ajax" with Source variable
		c.className = 'ajaxListContainer listContainer_' + this.params[this.activeInput.id];
		var id = this.activeInput.id;
		c.addEvent('mouseenter', function(){
			this.activeInput = document.id(id);
		}.bind(this));
		c.style.position='absolute';
		c.style.display='none';
		document.body.appendChild(c);

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

		this.listContainer[this.activeInput.id].onselectstart = this.ajax_list_cancelEvent;

		this.createIframe();
	},

	pendingValue : undefined,

	keySearch:function(e){
		var input = this.activeInput = e.target;
		if(input.value != this.pendingValue){
			this.searchAfterDelay.delay(this.delay * 1000, this, [input.id, e.key ]);
			this.pendingValue = input.value + '';
		}
	},

	searchAfterDelay:function(inputId, key){
		if(!this.activeInput)return;

		if(this.activeInput.value != this.pendingValue || inputId != this.activeInput.id)return;

		this.showList({
			target : this.activeInput,
			key : key
		});
	},

	showList:function (e)//(BL) Source added
	{
		var inputObj = e.target;
		var param = this.params[e.target.id];

		this.activeInput = document.id(inputObj);

		if (e.key == 'enter' || e.key == 'tab')return;

		if (this.currentLetters[inputObj.name] == inputObj.value){

			if(!this.isCacheEmpty(param,inputObj.value)){
				this.displayListContainer();
			}
			return;
		}

		this.cache[param] = []; // (BL) At one point, the line below was causing problems with numeric (zip code) entries. Believe solved.
		if (!this.cache[param])this.cache[param] = [];
		this.currentLetters[inputObj.name] = inputObj.value;

		if (!this.listContainer[this.activeInput.id]) {
			this.createOptionContainer();
		}

		if (inputObj.value.length < this.minimumLettersBeforeLookup) {
			this.ajax_options_hide();
			return;
		}

		this.alignContainerWithTextBox();


		this.currentListIndex++;
		if (this.cache[param][inputObj.value.toLowerCase()]) {
			this.populateList(inputObj.value, param, this.currentListIndex);
		} else {
			this.sendRequest(inputObj, param);
		}
	},

	isCacheEmpty:function(param, letters){
		letters = letters.toLowerCase();
		if(!this.cache[param])return true;
		if(!this.cache[param][letters])return true;
		return this.cache[param][letters].length == 0 || this.cache[param][letters][0].indexOf('#') == -1;
	},

	alignContainerWithTextBox:function(){
		this.listContainer[this.activeInput.id].style.top = (this.getTop(this.activeInput) + this.activeInput.offsetHeight + this.ajaxBox_offsetY) + 'px';
		this.listContainer[this.activeInput.id].style.left = (this.getLeft(this.activeInput) + this.ajaxBox_offsetX) + 'px';
		if (this.listContainer_iframe) {
			this.listContainer_iframe.style.left = this.listContainer[this.activeInput.id].style.left;
			this.listContainer_iframe.style.top = this.listContainer[this.activeInput.id].style.top;
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

		if (!this.listContainer[this.activeInput.id])return undefined;
		if (this.listContainer[this.activeInput.id].style.display == 'none')return undefined;

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
				this.setValueFromEl({ target:this.activeListItem });
			}
			this.ajax_options_hide();
			if (e.key == 'enter') {
				this.activeInput.blur();
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

