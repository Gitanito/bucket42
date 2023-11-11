<?php
if (isset($_POST['gamesession']) && isset($_POST['message'])) {
    $time = time();
    $out = [time()."|ALL|".$_POST['message']];
    $list = explode(PHP_EOL, file_get_contents('gamesessions/'.$_POST['gamesession'].'.txt'));
    foreach ($list as $line) {
        $i = intval(substr($line,0,10));
        if ($time - 60 < $i) {
            $out[] = $line;
        }
    }
    file_put_contents('gamesessions/'.$_POST['gamesession'].'.txt', join(PHP_EOL, $out));
}
?>
<html>
<head>

</head>
<body>
<form method="post">
    <input type="hidden" name="gamesession" value="436z34erge457234678">
    <input type="text" name="message">
    <input type="submit">
</form>
</body>
</html>
