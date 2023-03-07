<?php


  $name_world = "Deseria";
  $name_story = "Das Begräbnis";
  $base_rel_path = "./Welten/Deseria/";
  $startfile_rel_path = $base_rel_path."1. Stories/Das Begraebnis/Notizen/Plot.md";
  $output_path = "./Downloads/Deseria/Begraebnis/";
  
    $stack = [];
    $stack_img = [];


  $start = '
  <html><head>
  <meta http-equiv="Content-type" content="text/html; charset=utf-8" />
  <link href="//use.fontawesome.com/releases/v5.15.1/css/all.css" rel="stylesheet">
  <link href="//fonts.googleapis.com/css?family=Open+Sans:400,300,600,700" rel="stylesheet" type="text/css">
  <link href="phb.css" rel="stylesheet">
  <style>
    .phb {
      height: 297mm !important;
      width: 210mm !important;
    }
    
    img.big {
      width: 210mm;
      max-width: 210mm;
      max-height: 297mm;
    }
    
    img.mini {
      max-width: 313px;
    }
    a {
      color: #58180D;
      text-decoration: none;
      font-style: italic;
      font-weight: bold;
    }
    p {
      text-align: justify;
    }
  </style>
  </head>
    <body>
            <div class="pages">
            <div class="phb page" id="p1">';

  $mid = '</div></div>';
  $end = '</body></html>';
  

function findAndReplaceAllLinks($text, $relpath) {

  // find and replace images
  $list_found = ['<img src="'];
  $list_img_replace = ['<img class="mini" src="'];
  $list_ = explode('<img src="', $text);
  $relpath_ = explode('/',$relpath);
  unset($relpath_[sizeof($relpath_)-1]);
  $relpath = join('/',$relpath_).'/'; 
  
  foreach($list_ as $k => $v) {
    if ($k > 0) {
      $t = explode('"', $v);
      if (!in_array($t[0], $list_found)) {
        $list_found[] = $t[0];
        $imageData = base64_encode(file_get_contents(str_replace('%20',' ',$relpath.$t[0])));
        $src = 'data:' . mime_content_type(str_replace('%20',' ',$relpath.$t[0])) . ';base64,' . $imageData;
        $list_img_replace[] = $src;
      }
    }
  }  
  $text = str_replace($list_found,$list_img_replace,$text);
  unset($list_img_replace[0]);

  // find and replace Links
  $list_found = [];
  $list_replace = [];
  $list_ = explode('<a href="', $text);
  foreach($list_ as $k => $v) {
    if ($k > 0) {
      $t = explode('"', $v);
      if (!in_array($t[0], $list_found)) {
        $list_found[] = $t[0];
        $list_replace[] = md5($t[0]).".html";
      }
    }
  }
  
  $text = str_replace($list_found,$list_replace,$text);
  
  return [$text, $list_found, $list_img_replace, $list_replace];
}

function makeHeader($path, $text) {

  $trimmed = trim($text);
  $tags = [];
  $out = "";
  
  if (in_array(substr($trimmed, 0, 3), ['---'])) {
    $extr_ = explode('tags: ',$trimmed);
    $extr__ = explode(PHP_EOL, $extr_[1]);
    $extr = explode(' ', $extr__[0]);
    foreach($extr as $e) {
      $tags[] = ucwords(str_replace('/', ': ', $e));
    }
    $newtext_ = explode('---', $trimmed);
    unset($newtext_[0]);
    unset($newtext_[1]);
    
    $trimmed = trim(join('---',$newtext_));
  }
  
  if (!in_array(substr($trimmed, 0, 2), ['# ','##'])) {
    $filename_ = explode('/',$path);
    $filename = explode('.', $filename_[sizeof($filename_)-1]);
    $out .= "### ".$filename[0].PHP_EOL; 
  }
  
  $out .= $trimmed.PHP_EOL.PHP_EOL;
  
  foreach($tags as $tag) {
    //$out .= '> '.$tag.'<br>'.PHP_EOL;
  }
  
  return $out;
}

function renderFile($name, $path, $fn) {
    //echo $path;
    $text = file_get_contents($path);
    
  $Parsedown = new ParsedownExtended();

  $extr_ = explode('Part/',$text);
  $extr__ = explode(PHP_EOL, $extr_[1]);
  $ident = $extr__[0];
 
  $rendered = makeHeader($path, $text);

  $rendered = $Parsedown->text($rendered);

  $out = $GLOBALS['start'];

  $linklist = findAndReplaceAllLinks($rendered,$path);
  
  $replacer_s = ['\page','[ ] ','[x] '];
  $replacer_r = ['</div><div class="phb page">','<input type=checkbox /> ','<input type=checkbox checked /> '];
   
   $mycontent = str_replace($replacer_s, $replacer_r, $linklist[0] );
   
   if (!isset($GLOBALS['stack'][$ident][md5($mycontent)])) {
      $intern_content = $mycontent;
      foreach($linklist[3] as $l) {
        $intern_content = str_replace($l,'#'.substr($l,0,-5), $intern_content);
      }
   
      $GLOBALS['stack'][$ident][md5($mycontent)] = '<a name="'.md5($fn).'"></a>'.$intern_content;
   } else {
      return;
   }
   
   $out .= $mycontent;
                           
  $out .= $GLOBALS['mid'];
  
  foreach($linklist[2] as $img) {
    $out .= '<img class="big" src="'.$img.'"/> ';
    $GLOBALS['stack_img'][] =  '<img class="big" src="'.$img.'"/> ';
  }
  
  $out .= $GLOBALS['end'];

  file_put_contents($GLOBALS['output_path'].$name, $out);
  $fc = "";
  foreach($linklist[1] as $found) {
    $newname = md5($found).".html";
    
    $newpath_ = explode('/', $path);
    unset($newpath_[sizeof($newpath_)-1]);
    renderFile($newname,join('/',$newpath_).'/'.str_replace('%20', ' ', $found), $found);
  }
}

copy('./phb.css',$GLOBALS['output_path'].'phb.css');

include "pd.php";
include "pde.php";


renderFile('interactive.html',$startfile_rel_path,$startfile_rel_path);

$out = $GLOBALS['start'];

//var_dump($GLOBALS['stack']);

foreach($GLOBALS['stack'] as $k => $x) {
  echo $k."\n";
  foreach($x as $m =>$s) {
    echo $m."\n";
    $out .= ' '.$s;
  }
}
    
$out .= $GLOBALS['mid'];
$out .= join(' ', $GLOBALS['stack_img']);
$out .= $GLOBALS['end'];

$fullfilename = str_replace('Downloads', '', preg_replace('$[\W]$','',$GLOBALS['output_path']));

  file_put_contents($GLOBALS['output_path'].$fullfilename.'.html', $out);
  echo 'Open "http://localhost/bucket42/'.$GLOBALS['output_path'].$fullfilename.'.html" in your Browser and print to a PDF'.PHP_EOL; 
  
  
  //exec('wkhtmltopdf -B 0 -L 0 -R 0 -T 0 -s A4 --background --images --no-footer-line --no-header-line --dpi 300 --enable-smart-shrinking "http://localhost/bucket42/'.$GLOBALS['output_path'].$fullfilename.'.html" "'.$GLOBALS['output_path'].$fullfilename.'.pdf"');
  
$md = "# ".$name_story.PHP_EOL;
$md .= "## Welt: ".$name_world.PHP_EOL;

$md .= "[Interaktiv](interactive.html)".PHP_EOL;
$md .= "[Einseiter](".$fullfilename.".html)".PHP_EOL;
$md .= "[PDF](".$fullfilename.".pdf)".PHP_EOL;
  file_put_contents($GLOBALS['output_path'].'index.md', $md);
