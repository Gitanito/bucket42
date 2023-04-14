<?php
function listFolderFiles($dir){
    $ffs = scandir($dir);
    $i = 0;
    $list = array();
    foreach ( $ffs as $ff ){
        if ( $ff != '.' && $ff != '..' ){
            if ( strlen($ff)>=5 ) {
                if ( substr($ff, -3) == '.md' ) {
                    $list[] = $ff;
                    //echo dirname($ff) . $ff . "<br/>";
                    echo $dir.'/'.$ff.PHP_EOL;
                    $lines = explode(PHP_EOL, file_get_contents($dir.'/'.$ff));
                    $outlines = [];
                    foreach($lines as $line) {
                        $clearline = trim($line);
                        if ($clearline != "") {
                            if (!isset($outlines[md5($clearline)])) {
                                $outlines[md5($clearline)] = $clearline;
                            }
                        }
                    }
                    file_put_contents($dir.'/'.$ff, join(PHP_EOL, $outlines));
                }
            }
            if( is_dir($dir.'/'.$ff) )
                listFolderFiles($dir.'/'.$ff);
        }
    }
    return $list;
}

$files = array();
$files = listFolderFiles(dirname(__FILE__));