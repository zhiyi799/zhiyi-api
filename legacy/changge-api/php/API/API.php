<?php
function 统计() {
    $today = date('Y年m月d日');
   
    $config = parse_ini_file('../../API/config.ini', true);
    
 
    if (isset($config[$today]['次数'])) {
     
        $config[$today]['次数']++;
    } else {
        
        $config[$today]['次数'] = 1;
    }
    
  
    if (isset($config['总次数']['次数'])) {
        $config['总次数']['次数']++;
    } else {
       
        $config['总次数']['次数'] = 1;
    }
    
    
    write_ini_file($config, '../../API/config.ini');
}

function write_ini_file($array, $file) {
    $res = array();
    foreach ($array as $key => $val) {
        if (is_array($val)) {
            $res[] = "[$key]";
            foreach ($val as $skey => $sval) {
                $res[] = "$skey = $sval";
            }
        } else {
            $res[] = "$key = $val";
        }
    }
  
    $result = implode("\n", $res);
   
    if (!file_put_contents($file, $result)) {
        throw new Exception("Cannot write to file $file");
    }
}
?>