<?php
$lines = explode(PHP_EOL, file_get_contents("List.md"));
$hold = 100;
$pos = 0;
foreach($lines as $line) {
    if ($pos >= $hold) return;
    $tokens = explode(", ", $line);
    if (sizeof($tokens) > 2) {
        $nname = str_replace(['Ã¶','Ã¤','Ãœ','Ã¼','/','ÃŸ','Ã–'],['ö','ä','Ü','ü','-','ß','Ö'], trim($tokens[0]));
        $names_content = "";
        for ($i = 1; $i < sizeof($tokens); $i++) {
            if (trim($tokens[$i]) != "") {
                $myfreq = floatval(str_replace(",", ".", trim($tokens[$i]))) * 1000;
                if ($myfreq != 0) {
                    $myname = trim($myfreq) . " Hz (E)";
                    $content = "";
                    if (is_file("ETDFL_Freqs/" . $myname . ".md")) {
                        $content = file_get_contents("ETDFL_Freqs/" . $myname . ".md");
                    } else {
                        $content = $myname . PHP_EOL;
                    }
                    $content .= PHP_EOL . "[[" . trim($nname) . "]]";
                    $names_content .= PHP_EOL . "[[" . $myname . "]]";
                    file_put_contents("ETDFL_Freqs/" . $myname . ".md", $content);
                }
            }
        }

        if (is_file("ETDFL_Names/".trim($nname).".md")) {
            $ncontent = file_get_contents("ETDFL_Names/".trim($nname).".md");
        }else {
            $ncontent = $nname . PHP_EOL;
        }
        $ncontent .= $names_content;
        file_put_contents("ETDFL_Names/".trim($nname).".md", $ncontent);
    }
    #$pos++;
}