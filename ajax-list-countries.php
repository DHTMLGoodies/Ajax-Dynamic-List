<?php


$conn = mysql_connect("localhost","root","administrator");
mysql_select_db("ajax_dynamic_list",$conn);

if(isset($_POST['getCountriesByLetters']) && isset($_POST['letters'])){
	$letters = $_POST['letters'];
	$letters = preg_replace("/[^a-z0-9 ]/si","",$letters);

	$res = mysql_query("select ID,countryName from ajax_countries where countryName like '".$letters."%'") or die(mysql_error());
	while($inf = mysql_fetch_array($res)){
		echo $inf["ID"]."###".$inf["countryName"]."|";
	}	
}

if(isset($_POST['getCity']) && isset($_POST['letters'])){
	$letters = $_POST['letters'];
	$letters = preg_replace("/[^a-z0-9 ]/si","",$letters);
	$res = mysql_query("select ID,city_name from ajax_city where city_name like '".$letters."%'") or die(mysql_error());
	while($inf = mysql_fetch_array($res)){
		echo $inf["ID"]."###".$inf["city_name"]."|";
	}
}

