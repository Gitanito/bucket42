<?php


function listFolderFiles($dir){
    $positives = [
        "Bachblüten",
        "Chakra"
    ];

    $ffs = scandir($dir);
    $i = 0;
    $list = array();
    foreach ( $ffs as $ff ){
        if ( $ff != '.' && $ff != '..' ){
            //if ( in_array($dir, $positives)  ) {
                if (strlen($ff) >= 5) {
                    if (substr($ff, -3) == '.md') {
                        $list[] = $ff;
                        //echo dirname($ff) . $ff . "<br/>";
                        /*
                        $file = file_get_contents($dir . '/' . $ff);
                        $filename = str_replace([" ", "(E)", ","], ["","","_"], substr($ff, 0, -3));
                        $e = explode("/", $dir);
                        $dirx = end($e);
                        if ($dirx == "ETDFL_Freqs") {
                            $dirx = "Frequenzen";
                        }
                        if ($dirx == "ETDFL_Names") {
                            $dirx = "Krankheiten";
                        }
                        #if (in_array($dirx, $positives)) {
                            echo $dir . '/' . $ff . PHP_EOL;
                            echo $dirx . '/' . $filename . PHP_EOL;
                            //echo $dirx . '/' . $filename . PHP_EOL;

                            if (substr($file,0,1) == "#") {
                                $xl = explode(PHP_EOL, $file);
                                $r = array_shift($xl);
                                $r = array_shift($xl);
                                $r = array_shift($xl);
                                $r = array_shift($xl);
                                $r = array_shift($xl);
                                $r = array_shift($xl);
                                $file = join(PHP_EOL, $xl);
                            }
                            file_put_contents($dir . '/' . $ff, "#" . $dirx . '/' . $filename . PHP_EOL . PHP_EOL . $file);

                        #}
                        */
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
            //}
            if( is_dir($dir.'/'.$ff) )
                listFolderFiles($dir.'/'.$ff);
        }
    }
    return $list;
}

$files = array();
$files = listFolderFiles(dirname(__FILE__));