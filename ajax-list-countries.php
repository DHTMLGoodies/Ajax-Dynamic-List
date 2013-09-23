<?


$conn = mysql_connect("localhost","root","administrator");
mysql_select_db("ajax_dynamic_list",$conn);

if(isset($_GET['getCountriesByLetters']) && isset($_GET['letters'])){
	$letters = $_GET['letters'];
	$letters = preg_replace("/[^a-z0-9 ]/si","",$letters);
	$res = mysql_query("select ID,countryName from ajax_countries where countryName like '".$letters."%'") or die(mysql_error());
	#echo "1###select ID,countryName from ajax_countries where countryName like '".$letters."%'|";
	while($inf = mysql_fetch_array($res)){
		echo $inf["ID"]."###".$inf["countryName"]."|";
	}	
}

if(isset($_GET['getDomainsFromLetter']) && isset($_GET['letters'])){
	
	$letters = $_GET['letters'];
	$letters = preg_replace("/[^a-z0-9 ]/si","",$letters);
	$res = mysql_query("select ID,country,domainName from ajax_domains where domainName like '".$letters."%'") or die(mysql_error());
	while($inf = mysql_fetch_array($res)){
		echo $inf["ID"]."###".$inf["country"]." (".$inf["domainName"].")|";
	}	
		
	
}



?>
