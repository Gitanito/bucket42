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
  

function findAndReplaceAllLinks($text) {

  // find and replace images
  $list_found = ['<img src="'];
  $list_img_replace = ['<img class="mini" src="'];
  $list_ = explode('<img src="', $text);
  foreach($list_ as $k => $v) {
    if ($k > 0) {
      $t = explode('"', $v);
      if (!in_array($t[0], $list_found)) {
        $list_found[] = $t[0];
        $imageData = base64_encode(file_get_contents(str_replace('%20',' ',$GLOBALS['base_rel_path'].$t[0])));
        $src = 'data:' . mime_content_type(str_replace('%20',' ',$GLOBALS['base_rel_path'].$t[0])) . ';base64,' . $imageData;
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
    $trimmed = trim($newtext_[sizeof($newtext_)-1]);
  }
  
  if (!in_array(substr($trimmed, 0, 2), ['# ','##'])) {
    $filename_ = explode('/',$path);
    $filename = explode('.', $filename_[sizeof($filename_)-1]);
    $out .= "### ".$filename[0].PHP_EOL; 
  }
  
  $out .= $trimmed.PHP_EOL.PHP_EOL;
  
  foreach($tags as $tag) {
    $out .= '> '.$tag.'<br>'.PHP_EOL;
  }
  
  return $out;
}

function renderFile($name, $path, $fn) {
    //echo $path;
    $text = file_get_contents($path);
    
   
  $Parsedown = new ParsedownExtended();

  $rendered = makeHeader($path, $text);

  $rendered = $Parsedown->text($rendered);

  $out = $GLOBALS['start'];

  $linklist = findAndReplaceAllLinks($rendered);
  
  $replacer_s = ['/pagebreak','[ ] ','[x] '];
  $replacer_r = ['</div><div class="phb page">','<input type=checkbox /> ','<input type=checkbox checked /> '];
   
   $mycontent = str_replace($replacer_s, $replacer_r, $linklist[0] );
   
   $ident = (int)substr($mycontent, 2, 1);
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


renderFile('index.html',$startfile_rel_path,$startfile_rel_path);

$out = $GLOBALS['start'];

for($k = 1; $k < 7; $k++) {
//echo $k.'\n';
  if (isset($GLOBALS['stack'][$k])) {
    foreach($GLOBALS['stack'][$k] as $x) {
      $out .= ' '.$x;
    }
  }
}
$out .= $GLOBALS['mid'];
$out .= join(' ', $GLOBALS['stack_img']);
$out .= $GLOBALS['end'];

$fullfilename = str_replace('Downloads', '', preg_replace('$[\W]$','',$GLOBALS['output_path']));

  file_put_contents($GLOBALS['output_path'].$fullfilename.'.html', $out);
  
$md = "# ".$name_story.PHP_EOL;
$md .= "## Welt: ".$name_world.PHP_EOL;

$md .= "[Interaktiv](index.html)".PHP_EOL;
$md .= "[Einseiter](".$fullfilename.".html)".PHP_EOL;
$md .= "[PDF](".$fullfilename.".pdf)".PHP_EOL;
  file_put_contents($GLOBALS['output_path'].'index.md', $md);
