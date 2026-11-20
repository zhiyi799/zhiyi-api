<?php

$configFilePath = __DIR__ . '/API/config.ini'; 
$jsonFilePath = __DIR__ . '/main.json';

$config = parse_ini_file($configFilePath, true);


$today = date('Y年m月d日');
$yesterday = date('Y年m月d日', strtotime('-1 day'));

$todayCount = $config[$today]['次数'] ?? 0;
$yesterdayCount = isset($config[$yesterday]) ? $config[$yesterday]['次数'] : 0;
$totalCount = $config['总次数']['次数'] ?? 0;

$jsonData = json_decode(file_get_contents($jsonFilePath), true);

$dataCount = count($jsonData['data']);
$linkCount = count($jsonData['link']);
echo "╔API:" . $dataCount . "\n";
echo "╠友情链接: " . $linkCount . "\n";
echo "╠---------------\n";
echo "╠总调用:" . $totalCount . "\n";
echo "╠今日调用:" . $todayCount . "\n";
echo "╚昨日调用:" . $yesterdayCount;

?>