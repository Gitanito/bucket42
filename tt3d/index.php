<?php
    $cdnlink = "https://cdn.jsdelivr.net/gh/TableTopRodeo/CDN/";
    $default_room = "fantasy_tavern";

    $usersettings = [
        "room" => $default_room,
        "scenes" => [
                [
                        'name' => "Starter",
                        'map' => 'https://2minutetabletop.com/wp-content/uploads/2022/07/Forest-Camp-Dark-Occupied-Zoomed.jpg',
                        'entities' => [
                            ['ident' => 'tree3', 'position' => [.14, .011, .1], 'rotation' => [0, 0, 0]],
                            ['ident' => 'token1', 'position' => [.44, .011, .1], 'rotation' => [0, 0, 0], 'etype' => 'token'],
                            ['ident' => 'token1', 'position' => [.64, .011, .1], 'rotation' => [0, 0, 0], 'etype' => 'standup']
                        ]
                ]
        ]
    ];

    $assetlink = "";
    if ($_SERVER['SERVER_NAME'] != "localhost" ) {
     $assetlink = $cdnlink;
    }



    $assets = [
        "rooms" => [],
        "basicassets" => [],
        "assets" => [],
        "js" => [],
        "css" => []
    ];

    function getObjectSettings($filename) {
        $d = explode("/", $filename);
        $x = explode(".", $d[1]);
        $struct = explode("-", $x[0]);
        $out = [
                'ident' => strtolower($struct[0]),
                'name' => str_replace("_", " ", $struct[0]),
                'directory' => $d[0],
                'filename' => $filename,
                'type' => (in_array(strtolower($x[1]),['jpg','jpeg','png'])?"img":strtolower($x[1])),
                'scale' => [1,1,1],
                'position' => [0,0,0],
                'rotation' => [0,0,0],
                'color' => "ffffff"
            ];
        unset($struct[0]);
        foreach($struct as $str) {
            $s = explode("_", $str);
            switch ($s[0]) {
                case "s":
                    $out['scale'] = [$s[1]/1000,$s[2]/1000,$s[3]/1000];
                    break;
                case "p":
                    $out['position'] = [$s[1]/1000,$s[2]/1000,$s[3]/1000];
                    break;
                case "r":
                    $out['rotation'] = [$s[1]/1000,$s[2]/1000,$s[3]/1000];
                    break;
                case "c":
                    $out['color'] = $s[1];
                    break;
                default:
            }
        }
        return $out;
    }

    foreach ($assets as $dirname => $a) {
        $items = glob($dirname . '/*');
        foreach ($items as $item) {
            if (is_file($item)) {
                $x = getObjectSettings($item);
                $assets[$dirname][$x['ident']] = $x;
            }
        }
    }
    /*
    echo "<pre>";
    var_dump($assets);
    echo "</pre>";
die;*/
?>
<html>
<head>
    <?php
        foreach ($assets['js'] as $a) {
            echo '<script src="'.$assetlink.$a['filename'].'"></script>';
        }
        foreach ($assets['css'] as $a) {
            echo '<link rel="stylesheet" href="'.$assetlink.$a['filename'].'">';
        }
    ?>
    <script>
        let cdnlink = "<?=$cdnlink?>";
        document.addEventListener("DOMContentLoaded", function(event) {
            document.querySelector('a-scene').addEventListener('enter-vr', function () {
                window.setTimeout(function(){
                    document.getElementById('cameraWrapper').setAttribute('position', "0 -.8 .7");
                    document.getElementById('cameraWrapper').setAttribute('rotation', "0 0 0");
                    document.getElementById('cam').setAttribute('position', "0 1.6 0");
                    document.getElementById('cam').setAttribute('rotation', "0 0 0");
                }, 200);
            });
            document.querySelector('a-scene').addEventListener('exit-vr', function () {
                window.setTimeout(function(){
                    document.getElementById('cameraWrapper').setAttribute('position', "0 0 1.8");
                    document.getElementById('cameraWrapper').setAttribute('rotation', "-60 0 0");
                    document.getElementById('cam').setAttribute('position', "0 1.6 0");
                    document.getElementById('cam').setAttribute('rotation', "0 0 0");
                }, 200);
            });

            window.addEventListener("mousewheel", event => {
                //console.log(document.querySelector('a-entity[transparent=true]'));
                const delta = Math.sign(event.wheelDelta);
                if (!document.querySelector('a-entity[transparent=true]')) {
                    const delta = Math.sign(event.wheelDelta);
                    //getting the mouse wheel change (120 or -120 and normalizing it to 1 or -1)
                    var mycam = document.getElementById('cam').getAttribute('camera');
                    var finalZoom = document.getElementById('cam').getAttribute('camera').zoom + (delta/3);
                    //limiting the zoom so it doesnt zoom too much in or out
                    if (finalZoom < .5)
                        finalZoom = .5;
                    if (finalZoom > 5)
                        finalZoom = 5;

                    mycam.zoom = finalZoom;
                    //setting the camera element
                    document.getElementById('cam').setAttribute('camera', mycam);
                } else {
                    let o = document.querySelector('a-entity[transparent=true]').getAttribute("rotation");
                    o.y = o.y + (15 * delta);
                    document.querySelector('a-entity[transparent=true]').setAttribute("rotation", o);
                }
            });

        });
    </script>

</head>
<body>
<a-scene renderer="     antialias: true;
                        colorManagement: true;
                        sortObjects: false;
                        physicallyCorrectLights: true;
                        alpha: true;
                        precision: low;
                        foveationLevel: 0;
"  cursor="rayOrigin: mouse; fuse: false"
         stats
         >

    <a-assets id="assets" timeout="10000">
        <!-- <img id="test" src="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wCEAAoGBxQTExYUFBQYGBYZGhwZGxoaGx0cHxwgHSAZHRsfHyAcHysiHCApHRohJDQkKCwuMTIyHCE3PDcwOyswMS4BCwsLDw4PHRERHTApIikwMDIwMDAwMDIwMC4wOzAwMDAwMDMwMDAyMDAwMDA5MDAwMDAwMDkyMDAwMDAwMDAwMP/AABEIAOEA4QMBIgACEQEDEQH/xAAcAAABBQEBAQAAAAAAAAAAAAAAAwQFBgcBAgj/xABDEAACAQIDBQUECAUCBgIDAAABAhEAAwQSIQUGMUFREyJhcYEykaGxByNCUmLB0fAUcoKS4TOiCBZDssLSc/EVJGP/xAAZAQACAwEAAAAAAAAAAAAAAAAAAgEDBAX/xAAtEQACAgEEAQIEBgMBAAAAAAAAAQIRAwQSITFBIlFhcaGxBRMygZHwI1LBM//aAAwDAQACEQMRAD8A2aiiigAooooAKKKKAOUUUhcvgaDU+HLzNLKairbJSsXpG7iVXidenE+4a01u3WPE6dBp8eNRO1dvYexpcuKrfdGrf2rr76xT1iX6V/JZHFfZMPjz9lfVjHyn8qavjbhkZgsfdX/2n5VSsf8ASIJPY2SfxOY/2rPzqCxW+eLbg6pP3EH/AJSazS1OSXn+DRDDH2NKvO54u58my/8AbFNmJnVrnrcf/wBqy3FbcxDe1iLs/wA7D5GKYPtN+d1z/Wf1qr/JLy/qXKMV4Rrl0kfbuDyuP/7UicXcUaXLgMcS5b/uJrI22hc49q395/Wu/wD5q+OGIuf3sR8TR+Xk8SaLU8flJ/wa3b3gxCmM6tpPfUf+GWneG3v5XLfqjT/taI95rHrW9GJQz2mb+ZQfyB+NPLW+BJ+ttz1KGPgT+dNv1UOnf9+IyxaWfDVG0YHeTDXTlW4of7jd1vQHj6TUqBWKbN2jhmP1ZUMeTCCffx9JqcwW8N+we4/d+43eXyjivoRV0PxKnWSLQs/wnct2KSfzNQoNVjY++tm5C3Ytt4mVP9XL1jzNWaa6OPLCauLs5eTFPHLbNUz1RXK7VhWFFFFABRRRQAUUUUAFFFFABRRRQByvLuBqa5cuR59KZ37wVS7sAFEliYAHPjwFZs2oUOF2Mo2KXbpPgP3xqC27vPYwujNNzlbTU+vJfX0mqvvTv2zk28MSqcDd+038v3R48fKqNjdpKnGWc6xxJnmenrXPbnkfuy5JJFm23vpiL8qG7JD9lDr6tx90CqljNqW0JlszdF1Pr09aY4t710fdXounvPOm1rZ+nCtWPSeZsHkroWfbNxz3FC+J1P6D40thcJdvAM1x/IGPlXLWHAHCrBsSyII9a0rFCC4QjnJ9sjk2IDxFLLsMdKsS2hXSmlRZBW32Gp00qHxuy8jnuwOFWF2ZGjgRTfFPn8YOtWKyCA/hiJ7xnpNCW3jXX0qYa2ToFnzGgpO5YI4iocIvtDKcl0yKZ+REedPcJti9aAAJYfdbUenMekUpdsr01prdwBH70qmWnjJV9zRj1U4O/sS+G22tw/cbofyPP1irLu9vhewkKDnSdUYmAPwn7J+HhWb3bbDjTrCbUKaNLL8R68x4VleCWN7sfB0YajHmjtyq17n0Zu/vBZxaZrbaj2kOjL5jp4jQ1K187bP2s9p1u2nKsvBlPvB6jwNa3uJv1bxw7N4TEKNV5OBxZJ+K8R4jWtmHPv4lwzBqtE8frhzH7FwooorQYAooooAKKKKACiiigDleLjxXpmgUxxeJVFa45CqoJJPICs2ozbFS7Y0VYnjcWlpGuXGCqokk/IfkBWW71b0XMW0apZB7qdejPyJ8OA+Ned7t5GxdzQkWVPcXh/U3ifgNOs07F4w3Tkt+xzP3v8fP54ceOWSRbxFHvGbQLHJaPm36frS+zNkczqeOtOdmbMAjSpyxZAFdCEIwVIRtvsa2tnrERUPew+VitWaKjdr4bUOPL9KeLAhksGCY0HE/KrXuJsxb6Xy8jJ2YVh458wjgeC+/xpPd7Ai7bxNk6kqlxB1yFg0ePeHwqd3PsC0t1Iy8CfJhOaecED3U7IJC5u1bIshXj2jcOmYjN4EieCjzqo7xY5Ld9ltGbY4EGfj9rXnzq/WNnBsNiLIfvFbtvNOuY6ameZPOoLdvcJhmu3Oza4v+mrSbYbTvMB7eXU5dAYGuui7QsomNZmykgjOJBIiRyI6jxFJJlLQSQo6c6uW9uz8PgWL33bFYq53w13u21B7uZlB7x0IVZjTgABVKaOqj1/U0EolLV6yOA99JYlk+yQfCmSjxFLi1ESOIkfEflUAIRxpW9hXVQWUgGQCQRMaGJ4wdDVt3N3dDut657IburoQSADJ8AWWpTefdS/fu2gHGiInMhQNblxiTxLEwACW0mIockTRm52Wzqzhe4kZ25LJhZPKToBzqM2rsV7IDMrLm1AIIJHr+9RW72NhJaVbKCLduG1AOZ5BzsfvARlPUk/ZAEFvPuacSltg4TLnERmkEySY+1IJI4CTroBUNp8MaNx5TMUsYhkOnqOtSGGxZVluW2KspkFTDKRwPgad7zbAFm49sNLKdAI0H4vxeHL4VAI5U/MVVPHzaOlptTxT/AIN/+jjflccnZXSFxKDvDgLgH21HI9Ry8jpdDXy3gMe9p0u2nKuhDKw5EfuCDoRX0JuPvSm0MOLiwtxe7cT7reH4TxB9OINXY52qfZi1en2PdHp/QsVFFFWGMKKKKAOUUUndeB40k5KMW2SlYjfuTpyFZr9IO8Xav/D2z9Wh75++45fyqfj5CrPvxtr+Gsd0xdud1PD7zeg+JFY1t3aHY2zB77SF/M+nzIrk3LLP4svSSQntHGMxyW4IHtc5/D+tSOy9mQqtlgMJHTxAPOJqD3YUZHmc6kHXnNXvdu7bxFhLHaBcRbZsiOYDK2pUHgDoI6wRXTjFY1tQtblYnZtQKWNNcTiuzYoysHUwVIgg+M0kdpRxFTQo+Z4EkxTHFbSEEA/v1qOv4ou3HSnGDwZuKcoJdm7JADBzRLGSDAA1nkA54jSaoOx1u5j7iXu1tSRbjtQBmUAkgZhBjvHjyg6iIq/2Ht3yhAGozI68iPaVo5eB0PmCKz/d7Dps/G2Li3GYPmt3S3ssrADQRPtwdTyJ05KbP2hgVw9l89x2bIt5HfMCp7r5AZNthJdXUhpXjrQ5NMlRTRfhiexNxchDMY4yDEZWiJBIjlyAPWve0t4reFtWmulrZc923BLNH3ss5FmJJ4SOZiqHb3uu4btLbWmu3cx7NruZc6iOzuOIlgyFCVEazqJ0hcRiLlw/xOMvXS7CFRCULKJ7oCkBbcHyPxMbr6J2Vyzu0No3cRiL91rVsuznTLnOUaEJLyV0BmBx4cAHO6+2sRYu5LVu3eBAIVCSGJ7qgBjKsDoVleesRMS28F52+pwqFUOgIZj71jWPGnmB3mRLyfxOGOHuKyulxF7MggqRPBXU5RIYGfvJ7QTY/Ja5xpJdGs4jCXbspcu20IQMwCu+U8DqzhGA10Nvh76r2E3cW4frQgysHW5ZE27iSJDKuiyNQVgamp/DbQXEKrrDM57qj2HPDvTqMmVsyNqCOcCVwxBysBdukZoaCDrrwkKgJEkDjAE8AypFfJ5xGIVWRQ0RbMRpwgRHhAMeXSpWxdLMBPIE+HTX986qe8eEyqbqnUe2VAVSVM5VE8IkGDy1JM1zZ+Jv3b72gctq0SbrDmI0QHqxkeAmofD4JpNcl2wsMubrr6fZ+EfGu3iBoPaI00mPGOk/lTe5ilRYkCO6vPhI4Djw4fLWPDnuTLID7ROjdInjm8qZySXBXXJnW8+xsJZYqi3b11AzXShByyJ+tc/VWRrPsltRwGpzfbdlWOZEKjoXzz65V+VXvffapvObFlcmFtNBCiFZ+JLEaM0z7ideNVXadjLlERKhtfGYPqIPkaZK1ySpOMrRW0aKsG4u9D7PxS3dTbbu3U+8h5/zLxHu5mofHYbKZ5GkBqPL9iqa2yOpFrLj56Pq3DX1uIrowZWAZSOBBEgj0pasv+gveftbT4Jz3rXetzzQnvL/AEsfcw6VqFaE7RyJw2yaCiu0VIpyml95PgNKcXWgE1Vt8tq9hhnMkM/cXzbiR5LJ9Kwa2fCii3HG+Sg747Z/iMQzTNtO4nSAdT6mTPSOlZ3tC/29xm+zBC+X+TrU1vBiclogcXOUeXP4aetRGCtxTaPHSc2NN+BbYmMCwDpI9/KpjY2IVcQxulSI008oiP3xqvJhCxZVGqk6dZ1Eeh+FK7JsvdZtSVRST8AB+/GtclaEhJpmt7M2ts/E5Uu22a5lyBzmLQOBnnH4qY7a+j67HaYVu1T7h7rgf9rfA+FUTZ2LdXKgs2msQBH4iIgedWO3isbi1CBstgCIA7hnjC/9T+Zhl6TVNuD56NDhGa9K5FBuhi1Uv2QIALEC5bYwBJ0VyalN0ML9Rh3Ome0zsf8A5CxaPMCJ6MetPNhbgWHabt685jirm0o6wqiTp1OutQ9nbpwg/hLtn6yyDaQkkZ1RoDFcsn+kww1kTpZGamUzg4OmNt9VykMpjKpCjj3nIC+6SfQdaqe09ni3ZUgd79SABHTU+OlKY7a4u3JLEhSzsW0JJ6A8AOGscAIAFc2zjg1tUUd46kQSTOYAxGijkOLEiBpNMLwSuzdp3byi0WkACA5UggZcwZC2aYkgjnxp5d2S2IupaAlnYu0cSgOW2vgIHvnqard7Zt3B3LD3rcSyspDTw4qTyaOI+daJs63lxBymO1sxaMwPaDJryBVx7qTjtD07plh3b3SwjW4D58pKEJAVSNCASJMcJBg1E74bJsWwcNcyvaILAEDPbMe0p4KfdNWndfC9jaggqxOo0JHHQR5moj6Sxa7HKqgXmOVTz73Pxjx8aW7HjxKn0V36PNoC1hsQlxyewbMDBkhYmTHE2+zHgVU1drWOt3LJuq854W4Ryy90oI4KDJ8mYjiKxzG7SezZe2oIu4lzJHFbeZRr1JVB6GrJu5vKuCKi6rdndWWHEEahXSDBYQykc4iZAFLKTjJfElQUov4F22va7S1B7sMnd6KzQxPQi2G04cfAmSsW+wsQFliTcaOLNoR/vyr5CmGA2vYxBLWri3LRg3GExI0A1Eg8yOUcNadbTx6BS7NlXSW6CQRHiSBHv6U64Knb4PQugEmCSvdkczEtl6AGST+ldw+NW5IILjmeWvIRr6fCqvjdrG4C7sbWGGgHBrnhprFS1+6qYZWRcpYgqBx4E+/h76hNXSHlBpWyC3pwtjCMr3ynZLJs4VBlBPiOn3nbU+yKz/au0HxF171wyzmTHAcgB0AAAHlTveTGvexDvcbM85fIDQAcgB0HjrTCxazNHLnVyVFLEsQsoQRoahnB4TNWPFnOwReVRO2ML2ZEGZ0NJNcWa9Lk2va/J53Z202CxVm+uuRwWA+0p0dfVSfhX1Dhr63EV0IKsoZSOBBEg+418mXV51vn0Ibb/iNnC2xl7DG3/T7SegBy/wBNEGJqoU7L9RRRVhkGmPbQDr+VZt9J+LzXLVkHRFLnzYwPcFP91aFtG53o8Kx7e3F9pi77cQGyf2AL8xXG1E92V/A14oelFN21cL3SJ0UcNNTxP5VxXCiSafbIwC3WZmmWJMydJ6V7xuBFi+koHtgzlMGUYFSBm5rPXkDImupjW2KiUt22yMxIIOZTEiPDTh8yKkt2kDB1kzc7zNwhF4cOZ108Ka4u0pDBAVSTlBMlRyE+Xn5njSezLxtJcY6CAx6mfYX8/UVYQWHZ+EXEXDbRcli2wkffYc2PMD5+kaNsUolsKAPM8T+lZtuxi8ihOozM3UnU/OrThcUQsDlpVOSG41YZqKLRf2iyCUIj8vnURvHj12hZfDOYVXtZ7kgG2WPcK6E5iyxGmnEiRVV3n3ia2Gt2j3wO8/JJ5Ac2/Xzrm4+2bQch9NCnNlfNGbOv28xAMyII8qTHjadjaicHGkuSP3z2Jbw+It2QyuXQXO0IaQCzKshmYT3eMngeGlP9jbBtIwuMc7AyAdFB+91ZvEk+lOt8NifxGIW9ZYh1XKyurDNk1GQkamG8RpxBmXmAsMFQEasoaOfMe/SrMm4pwbRfaeATE2Ws3ODagjipHBh4j4iRzqv4HbIw+XB49GGQk2r6c0MxpwIkkzIIkg9DarApbG7Ks4hMl5AygyORB6gjUH9mq4Sounj3c+RHDb4oEynEIy8iysHj0EeUwdPclhsf/FuxXNmRraK8AFBebsyQDPdkiSDIGaMpINebG56W/ZvPlHJpPpowHuAq0bpbv9kHLCczKwIEaKwdeJJJJAPHoORpk1ZVJNLlmRJu7i8RiijKM6Nctl4ItoUhWPI5VDDLzYkcpi14/cXKcJZ7XOLaEPK5SS9x7hOjaAZ4jz1rRVwNqxmuEKJZ7jBRqztqfM6AD0pna7xNx57V/sad3zImOXw0mpfIsZJEXhsHh8PZW2AFw9rvmdc7D2QR0Gnr8YrE403z2txSLU/VofabxaNNePTUDlXrFYZ7l8teuHslAZbZ7qrPh5Rq0nU+VPtk4RXvFmuW2XgEDAkdBA4DzpG/BbCCXqZU8eHxN9LR5sBA4KOJ+AP7irZvjg1uWFBum1kZlUzlHsgMGJ0gzInoI4Uls/Z627z4htCXbKOQ1JPnwA9BVgwH1lspdAZCvMAkCBx5HTXWmxiZjFsThWDcQ3Q6a+IPBvQzXRcyL4mr/vBuHbOb+HhbkZgg7q3B4D2VbxWByIEzWc382Yq0gqSpBkEEaEEHUHwq9OzOeFeDNIbR7wPWnN2yRl046jx8fKvD4dvCpZMW07RAuDBir9/w/wC1ezx1yyT3b1s6dXtnMv8AtL1RbqZSR4xT3cPHmxtHC3J4XkU/yuezf/axqqHZt1PMU/c+pq7XKKtOcQuOaWbz+VYltLEZjdufeLt75NbFtC5q/m351iWMP1beVcGPqyP4v/p0qqH7Dzd1NBU1tTAi9ajQMNVPQ9D4Hn6HlUPsDQCpp7uldryYUimYhCsgggg6jnI5evD1qN2gx7FFH2mJPiAAF+FW2+kngCRzI4VC7IwYuoGJGa2Igjn9rTy+dNYdjPAbQKATo3DXmdYM8PCrOm3JtkrAbKY840qvXtkyzjgOIjUa8OdNrhuWWAcGDoCNR5edHZKuJ3H4glEk+05Y+JH+aW2TiTaucRoASTBHCeYI50YW2GCTyLj3gMPkaaYq2MzToM4HoAfl+lHgL5L7sPbLvba9cbL3jkQaSvEyJyzOo0mTxqTtb04a8pRm7O6vdkGM4kkLrGstMiR1I0qltjsllgn3SPy0qCwzRPcVsyle8JieYPIiltvstnGMWtpo2C2wGMazBJ000ygxryk/21KbOxzuzZUZlVWJJkLIUlVDHSS0CKo24mDudqViEykknqCoEe81Yt4NjuyQrMus90kH010qlqKkWxcnGyf2Di3Ia5jHtWxwFvOC/iGgx6An36VLHfi2zEJ7PAQyyfUH5deVZVg9lsGbtVNyRA7QElT1GvH31K7B2EizNy4x00WVHGeA4/4qW4roXbKT9RoV7ecMMsZRzM6+QjQCvFjEWu0DFwGK5E/qPTkBAk6cY50wwGyBAzSAOXM/pVF+ka5cOMCIWXuoFKkjyiOGrNUR75JlFKNI0PaGEW6QGBhlE6mZ1jhx8uopvs3ZfYOHyNAgMQNeJ1gkE9NNdedRu+m8GIwdnD30QPnALs3ANlWeHAsZM8PCltlbwW7lmwO1I7dGFsuZe3cQEd4x30DCCT59aWfCvwTGV8eST2hCm2ZzW2b2we7EnMT0MkTPACedN9mobW1r9xWLJcFsFPuOiqpBHCCsEHx6a1FbExDpbslyZOUXFPJ5AY+eZuI46nWasIwg7a3dGgIVGEcGQ90+ErI8lHSpxyco/JhkhtfPlDna/sNbDQVbTqv3CPGIHjVY2vtl2su5tI161C3JRGlToLgJUtAJHAjQ+E1Lb0bRW1iBnkJcgZuKzGmbpw48Osc4DeYFHW6vNSrRwZeDA9RB909K0Iy0VFbpYl2Mk86cLhJEsTPQUjirfZ3GTkraeI5fCKk+0R1BB15ipkKio7UXLdYctD8BUW1wq+YaFTmHnxqX2/8A6un3R+dQ+JPeNJH9RunziifUP/M6UVhH/NzdaKsMW02naVyM/m3zNYtjG+rPlW0bWMXWH4tfWD+dYvj0/wBRJ1GZfdIrgYf/AFkvZnSmv8afuh7sS+sDWpi7cUiMwqrbIsSONS64Lxrus5qYvcRZ9oVEYvCXEvdrZhg0ZlniRpI1HEaaVI/w3jXWWBQBG2dsJnJe2QCuUrIkGdJBgjQ8uNMNrbSFy3GULHSToPlrUtdtBvaAbzArz2KCIUA9YoomyGwtzIBIy5jIB6QRPx+NJYkzPXMSfcBUptDCC4IOhGqnof0phewjNdtiQpeRMaZo4eTUxB4wt/Qg6jhB9f0qb2LkFs9oJUQCea5s2WfPKY8j4TDHBNaYq4A5gTIMEcD7xrFWTc1LJS+r5S75AFYGFClzM/e7zQRwyjmRSOO7gZTcSx7t4dCme2O6efWKniojUaU13XvW1sLbkZkARh0ZdG95k+tOMfjrVtS1x1VRxn3cBrxqhqjYnaI+5csBhPMwOMT0qWwTA91Fk/hE/IVF7Lxy466LdlM1pTmdmUiY1AExrIq44ZLVohEygmcqgiSRE+PCAZ8OlRTFlNIirhIEGQehEH3Gs53ou58eoH2MoPoA/wD5Vp+8G0LbSkEXEjjKmCAZGhDD3eFZvibOfEkgTLsP9wX8qJOgh6i3HaimwU0cgqhTQgyIAI81+NZ3vHs+5bxDM6lXlYAGWOMKF5CDpHnzNWjdayLV25euGFa8up6BnJao7fHeT+KuzYt3HySoyrxA6nr+HxNQm30PJJdjPZG0me61l3GdCWHMsBdz3Bpz1nXkDWnW1lHiADlJ9QSI9R8axLBbOxVy8l0WWU5gRIy8eA70dfcedbFtDayYezbRiGusFARRmZ2gLwGpAg/nVsYxiuCmUpTpff2K39KGOfLYt2VLXS0gASdBq0cwDpPLNTHZ/bmzGJTLcVgVhlacwhuBMcQI89SIAktrbMxrd62txG4nLbDs0cAWUwNBzEeUQYVcJiVYo9m+D97I5E9NFKifDUeWoN19D7IQTt38qqyM2p33Zxzj3AAflTJ/WpK+6rM2bixoQZUCeAOYSOHwpA4kNICgD31ejEyu48d/0/Wo3EHU/vlUttNvrD4R+/jURiNSY/fKq1zJm7JxhiS3/L79DRW7f8mjoPdRT0YtzFN7BlvT94A/+P5Vkm8NrLiLo/EW/u7351sW/wBahLdyOZU+okfI++so3os/WC4PtDKT4r/ggelcGUfy9XJeHz/fqdfHU9KpLxwQWyrkaa6aVMrdHjUds5FDmRx11qZCrwy13Iy3JM5Mo7W0I9oPGvfLjStnBl2VVgEnieXGksbZNtmRhDKYPzB8iNfWmTXRFOrEnSknQjjpXi9mK932hBHmNY9eHrT3B7Wt30IPtDRlPEHy41DbQJWMGFIYqzmWAYYEFW6EcD76msHss33Fu17RnjoNOPlXrb27t3C5e0ylW0DLMTroZGh0NCkmS4NFUxu0brhVuKJDa6QwnTWNIP6V7sNlvIyGCNQT6z51I37CuIYT0PMeRphiBF5emYfkfzpiFyS+Avvig6AgXMoZHXukHQsCRy740/B402wuIGi3VuXCsj200bVZ1CmYnU5jrpT76PMEy3DcdSBBCg6ZtAGIH3R97hMCrM+wku3LYEAvcCkwCcogs35/Oo2rsN/ga7Nx95rRTDxazIIKNmYH7R7oEyBGp/Sp/dPdYMX7ZrlwXCGJuGQW78FV4CCG1ifE1PDZKWrSAaaqszqS2bmeJ7wE/h9KV2jtS3hrZuPAVYAHCIAHPgJMetJTH3KuCB3iv2rfZAEm5lChCx5ltTOo5TFVrdvvYjD5jJbvE9SQ9wn3imdnGhi+JuPq7uVzHhJmB09rhXrdksL1vkVssfL6lgPi1VNF6b/c9bVxUFZDP9y0g1JPEtz4R5addeXFvgKbgW1bPdFq20O5PAM4EqNCxI1AA5sKlLSNDJYUsx4nm3AceQk/pVY29tfs7oRsxa2wtHN3TJjPdjXQsFhSdAq9KVQbLsk1HyethbRBvm0WGR2yXIVYtkmFYZh3oJ4meojWo5r73bpVrvZW1PZqEd2DZO73QpDPqJ8SeM1IYYWBmxKqQlsksxn60g8EHALmjXiToI5Rew8ED2mJLWwwDvF1iDoGYhAFOZ2Ogkc+pq3hX/eTNbbX94NR3Z2cLdtXF1mIX23AQDkCFDnN6tHjUxhNqG2pFy5at6kkggRoIOVllvHMZrO8Ttt0At2QQ2TM78wCSFC/d4e1x6EampDc27aZ0e6FuXJ/6slViIyrwB4amSOvKs+yXZc3B8Pll72ztTCYmybZxNsqYzBWzTHIhGDxMGFIOg1iQaDvbugUQ4jCqptBZcK+cDUiUk5ssQYMkajlWsvh7RXvIpWOBUH8qzreq7h7Au4jCt2DgHMiibV0nhmQaKxnRhEzrOlXNtPszwip8JMyG/clmPU163Vwfb43DWonPetg+RcFvcsmksSSqk9RVt+grZfa7SW4QYs23uTyk/Vr/wB5P9NWY+eTRq3tSh7I+h6K5XatOcRW82D7XD3EHtRmHmNR74j1rGtq2c9smeHeHpx+BNbwaxzfTA/w2LdAO6xzp0hp09DI9BXM1+J7lkXjg6f4fkVSxy+ZS5ykHp8qsW5mHt3FZX1YlgW5gyQCP04VBYqwAxHUSPL96elLbr49rNx0PNsw9atwZLjSIzY1Ge5rh8Fgay1i+ttwcxJynkQATp56V43vdC6FSCxXvQddDzHrSO8+IcXLd4zC99Z4TAW4s9ICtH4W5mlNqpaxNvtbRQXgNJMeJVpgQRImr75UipR9LiQ6imuM2ZnbtLbZLnAnk38w/P504N0Bih0ccVPEfqPEaUsp5CrTKd3P2ldsXjmgusMYjRToSOo6iJ4emlfxVrFYe4l1TlIgxBg/ZcdIrHMfjlt4hHUyUGVyOEHkDzIn5Vd9jY8gSp7rdPmPOqZpp2jTjalHayG21sp8O+VtQZysODAfIiRI8aru0mhp6FT8D+lahjbH8ThshGvFTGqsJCsPkRzBrMsc7WrraFXUL5qQWHvFWRlaKpQ2sv2zsGtkXmiHcAv4aABfBtZP8wB1BqT2MwBd7hi2g11iZBMeugqN7MizpxYBh4yJn4CktoNJOvdDajxOg+A+NWvopXZZN7d5Ldn+GJZQFcuR1yrwAGpIzaDrVB2vt25izmuwF0IQGROsctTr8qbb43GvYpkZgq2sqDrJS2X4ce9p/TTjZdm2uoDM0aaa+nQ/Kq30WwVu2JY3BMLeZxBM5E+7pqzDqAPSetP9mkq93Lx7FwPXJ/4z7qRx9gg9722InwHQeArxfxvZElSM0cBr4kf7aSui2Tq6J7Z+1hYzZjkVV7zqJuZuKqJMGBJyiIke0STUJvThrWMWxis6oYK3p7sqhXveB72XWDJPSo59pm4IsDvOSM5+zoC7+AXu+ZI5gRA7W2oXmyhbsgeZJZyCTLE66sS0dT4CHV0UvuxTa2IN4gp/pW+6qiAqrpEa6kgSdNO7rwib2Xhbbm0FQsXCliT3dAY06y3vjwqC2RfBDWmMAg6xP3SDA1MFdQORqd2fsvEYeLoCvbnRkcPk1kAZW6wDIpJ+xZB+RzicXcLKWB7DP2YyMO4S2UMyBiVzFSJIg5RxJqb2dsxEcQSw0YMGMciDoedQayxMAorMGa2GBlgcwaBJ9oAxA111qZ2Viob6xmTXj2TMI6yIikndcMsgubaLxhd58Iq9ldvhHMQpfXXn3pj18PCsz+ki0LV4W0uFwwzEdBPd1GjAmSDpw4U9xWFwwa69vEWxnnOt23cQtoc0C4Ar8iAOBAIql4vFFyXdieUtxgcB7qWqS9zRpoXNvwuSNx9zgvqfyra/+H3Y3Z4O5iWGt94X+S3Kj/eX9wrE8Fg3xN9LNsS9x1RR4sQBPgOZ8DX1ZsTZqYaxasW/ZtIqDxgRJ8Tx9a0wVIxajJvm2PqKKKYznKqH0m7GN7D9sg79mW04lPtj0gN/SetW+uEUk4KUXF+R8c3CSkvB85O2fiZ6ae+m922SVZeI+VWP6Qd3jgsQcoPZXJe2en3k/pJ08CKgEuBtfePGuWlLFL5Ha9OaHzJ69tAXsObN2xcZmgSqtpGoYEAjiI9ajMHslixObIoOvaE2uHEExwPgfSkBtG6g7txgOoikrzte/wBRmcDhnJI+Ok10INSja6OdkThKn2iY2jvFbsAKoW4wEQgJUacCWIP+2q5isdfunN2YthvuLlUDxEz7hrTlMMoEDrwHKnaWtKeMVErlJy7IO3hbZELckk68fj01qw7LutaVY4RqOviOlJ9gCdQKd2cOP81L5FXDLpuftW3cBtkQw4c5B5eYI91VL6X9j9ldTEKO7cXs2EcGQ5gf6geH4fGlcALa3IhgQQRrGY/v31d12Yl7D9ncHa23AzI/I+B0KsD0OkaVTdSL9u6JWNn3S9t+lq0oUdAoInzJn3Co7b2J/h8sCe8CZ4AxA9e78atdzdn+HF3KSbTIFUzLArJAbTz158OMTUN9MevIAi4oGvAEeI4GTM1oUrRmcaZG4a1ZutndnzEljEak8z6nlFTyZbSlgMqjlz9/E9Kq2xrTcSCRPGrFirJa0deEGPKJ+FK0PGVeCs7Zx927cJUMQpmBy/cUYe4S02l7RwZyKO8ZzEAxx7pJnUwPAU4u23uWrtpQTBLhRMnjIjnpJj8NR6Obr4a3bcZtM5XTK2ZpYn8K6+EUjb/ger/cWx21ke2wtWjaWAWWQZd+kAdycx/+zTHBbBuXhnDIoBElmnjzgAn3xS20bwv4i8yLmXtSVCzHZqSFE8RIA99P8NhilorJts5LcpUaxz8fhTOToRRVjnF7v4a2bWa7dk5VVsqwSTAgpcJXU8wf1b737Nv4O4to3bbhhmBQBuMSGDDutBHEcCNTrUnsq7nsNevWLIw9mMl1VuBmYEBYBuRcOYjvMSBx1iKi9pYl8RfN62BmPtSTrBMHXgNYgCO741NcckW74G2Cw+If2rrqPMp7soFSrbDMSbzeGrn4lqXxeL7O12cg3LndEycs1zG40KkcTGn6mq22a8UYz4atkPtG46/VG6XXxM/E6+lQ21rkAKOep/KneKxAEsdT8zTbYWyruOxNuxbEtcaJjRRxZj4ACfSKmEbdstzTjihsj5ND/wCH/dfPdfH3B3Um3akcXI77D+VTl/qPSttqP2Bsm3hMPbw9oQltco8eZY+JJJPiTUhVxym7Z2iuUUEHaKKKAIXe3d9Mbh2stofaRuasPZb8iOYJrAMfhbuGvPavLFxCQy9ehB5gjUHxBr6YqmfSTuQuPt9paAGJQQpOgcccjH5HkT0JqnLjUlZp0+d43T6McBDCeX70prbtFW1LFTw7x/Wm5Z7NxkZSrKSro2hBGhHgadi4GEggj98ayR3Yn8Dqyxw1MK6kh9aw4JlZPhzpcjlJ9RrUfhsTGh4VIg5h7Wvjr8ePzrdGSkrRyMuOeKW2SpiSvlbWdfSlWxXIDWuMX6T5U0PeMDhzqaF3Ci491uZge6kFp4DURqOZ0AHMn1qwJi3xFhyXezdQq4COyh7Td0kERDqe9xykBundjsNiRZS4qFO1urHfAhRlYFgW0DEMRPH3052ItpEgoH0i2rfaMQ1xwO8xyiFEgCfAClaXZO59WSWwdvG0vZsVugmGMuZ8MzOATA5A660+3w2PhL+GBtvbtu3eQtcJUMOUZWJHEGDpVT26MtwpaH1LEXEUycoM5FPNysxqY66zT7C7p4jGQM0LwJPdHlp8hAqKrkLsi9m4K9YeA6NH2rbSCPUCasuFutPfGvQiPhSlzcbFWIi3bv2/vWwFeP5dJ/pb0FL4ZVB7Ngx/AVIdPQ+I5xNMpJkNPorm09mtbfOkgTIPTmB76hNv43E3BkZ2KxrxJI6MSTInl75rUV2WrCGI8ZKj5mmG0t0pEotsj8Tf4JNQ6fLQ0E+rM3w+yDkC9oyTrCnn4/ePwFSa3zbTK3ZOkah1gn3GX8j5Gak8fulfZu/cKp//ADGf0gEfGaY39hdguazF2OOdVzeXeB92lLu+JpWNNcL6/wDCHvby3rpy3GDqAFKHu6AyAuWFUCAcoGhFPsBda7MJbUDQaEz7zr5+FJ4Xa9i4wTFWFUj2XSUZeh01jyPp0etlsew4uKdUJMMv80CD5iOHAU25XyU/kyf6Xf3HGJW3ZTNcBdnggn2WjUjhpGn74V/EYgasTAHjw8OppTH4wuc9wzA48AB0A86ruPxmc6aKDoPzPjSv1P4GqNaaNvmTDFYgu2k9FHn5czW/fRDuN/AWO2vL/wDs3QM3VE4hPPm3jA+zVd+hr6NypXH4te97Vm2w4dLjDr90cuPGI2CrUqOfkm5OztFFFSVhRRRQAUUUUAFFFFAFH+kb6P0x69tZypiVGjHRbgHBXj4Ny8RwwnGWLuGutauoyXEMMrCP/sHiCPMV9W1Xd8dy8PtG3lvLluKO5cX2l8PxL+E/A60koKRfizygfPdnEh9AIPSnNu8yxSm+G5WK2c/1q5rRPdvIDkPSeaN4HxieNRVvGffEjrz/AM1n/LlB3E60dRjzR25VfxLDhscIrlu5JLE68TUKbitGU+vD/NLpiSIBM8PdViy+JGfJ+HterG7RNbOt9pfQtlAzA97gANdfSpPbVwszDvCyoChYILidEHMBjqY61AYHaChtdPOprZmKFy7LtK20Zx4QNPWSKsTT5RhnjnF0018xPY+FZsTFwiV9oAAAMZOVQOSg5fMk61pexmyqANBWe7KxAzs/Vs3xkfKrts3HKY8aWaY0GqLPaxXjSmJsWb0G5bVo4EiSKiLWLA4mlv45eopERKNkkNl2CIFq3HgoHx41G43d62PZlfL/ADrQu1VE61GbV38w1oQ1wMRyTvH4cPWKe6FUJN0lZH7QxD2WNu5qDwbqOhHCqvvCij6wPHXWAen+KS3i30OIkImUfebU+4aD3mqxjcXOtx+HU/KkbjfBux4Z163SE8dkdwYJ/f7+NecXiUtjXj9kDjUff2ppCD+o/kP1o2JsPE4672Vi21xzxPJfFmOijz9KZQb7CWeGNPZ37jTE4prhE68gB4/M1rv0V/RSUyYrHp3vat2W5dGuDrzCcueugsP0efRdYwGW7ei7ifvR3Lf8gPP8Z16RrV+q1KjnTyOTtnaKKKkQKKKKACiiigAooooAKKKKACiiigBHEWFdSjqGVhBVgCCOhB0IrMt7voYtXc1zAv2LnXs3k2z/ACnVk+I8BWp1yglSa6Plbb+7uKwT5cRadNYDcVb+Vh3T5TNM7WOI4gH4GvrC/YV1Kuqsp0KsAQfMHQ1SN4Pog2fiJa2rYd+ts931RpAH8uWklBM049VKD44MNt41T1Hn/inVu6CO6wnWYPLxq2bY+hHG25Ni7avL4k229xlf91VLaG5e0LEi7g7w8VQuv9ySvxqv8leDbH8RbVSpiyYl09liKdWduYhfZunTwU/MVV7oe2crZlPQyp9xryMU33m95qNkvcl6nE3zFfQuTb0Yo6dsf7V/9aRvbfxR/wCs+vQx8qqn8U8e23vNeRdZjEsZ5STP61Kxv3ElqMfiJYsTiiw+tuFh+Nyfmaavj7a8JPgo0+OlJ7O3Xx14/VYS8088jAf3EAfGrTsf6Gdo3YN0WrK8875m/tSR6EimWP3Yktb/AKpIp17azHRQAPef8UngsFexNwW7Vt7lw8lBY/DgPHhW2bA+hDB2obEXHvtzX/TT3Kcx/uq/7K2TZwydnYtJaXoihZ8THE+Jp1FIyZM8p9syDdD6Errxcx75F49lbILnwZ+C+Sz5itd2LsaxhLYtYe0ttByUcfEk6sfEkmn9FMUttnaKKKCAooooAKKKKACiiigAooooAKKKKACiiigArldooA4K7RRQBwV2iigCE3p9isO3w9pvWiioGQ23e9sVs+5nAeVFFAxbq5RRUlZ2uUUUAdrlFFAHaKKKACiiigAooooAKKKKAP/Z">
        -->
        <?php
        foreach ($assets['basicassets'] as $key => $a) {
            echo '<a-asset-item id="'.$a['ident'].'" src="'.$assetlink.$a['filename'].'"></a-asset-item>';
        }
        ?>

        <a-mixin id="cube" geometry="primitive: cylinder; radius: .05; height: 0.02;"
                 hoverable grabbable="suppressY: true;" draggable droppable
                 shadow
                 event-set__dragdrop="_event: drag-drop;  material.opacity: 1; transparent: false;"
                 event-set__hoveron="_event: hover-start; material.opacity: 0.7; transparent: true;"
                 event-set__hoveroff="_event: hover-end; material.opacity: 1; transparent: false"
                 event-set__dragon="_event: dragover-start; material.wireframe: true; material.opacity: 0.7; transparent: true;"
                 event-set__dragoff="_event: dragover-end; material.wireframe: false;  material.opacity: 1; transparent: false;"></a-mixin>

        <a-mixin id="tile" geometry="primitive: cylinder; radius: .02; height: 0.5;"  material="opacity: 0; transparent: false;"
                 hoverable grabbable="suppressY: true;" draggable droppable
                 event-set__dragdrop="_event: drag-drop; material.opacity: 0;transparent: false;"
                 event-set__hoveron="_event: hover-start; material.opacity: 0.7; transparent: true;"
                 event-set__hoveroff="_event: hover-end; material.opacity: 0;transparent: false;"
                 event-set__dragon="_event: dragover-start; material.wireframe: true; material.opacity: 0.7; transparent: true;"
                 event-set__dragoff="_event: dragover-end; material.wireframe: false; material.opacity: 0; transparent: false;"></a-mixin>
    </a-assets>

    <a-sphere roughness="1" material="side: double" open-ended="true" src="<?=$assetlink.$assets['rooms'][$usersettings['room']]['filename']?>" rotation="<?=join(" ", $assets['rooms'][$usersettings['room']]['rotation'])?>" position="<?=join(" ", $assets['rooms'][$usersettings['room']]['position'])?>"  scale="<?=join(" ", $assets['rooms'][$usersettings['room']]['scale'])?>"></a-sphere>
    <a-box src="<?=$usersettings['scenes'][0]['map']?>"
           position="0 -.01 0" rotation="0 0 0" width="1.5" height=".02" material="roughness:1"
           shadow="receive:true" id="table"></a-box>
    <a-obj-model src="#<?=$usersettings['room']?>_playtable" color="#AD6B1B" position="0 -.905 0" rotation="270 0 0" scale=".1 .1 .1" material="roughness:0.7"></a-obj-model>

    <?php
        foreach($usersettings['scenes'][0]['entities'] as $entity) {
            if ($assets['assets'][$entity['ident']]['type'] === "img") {
                if ($entity['etype'] === 'token') {
                    echo '<a-entity class="cube" mixin="cube" position="' . join(" ", $entity['position']) . '" rotation="' . join(" ", $entity['rotation']) . '" material="src: url(' . $assetlink . $assets['assets'][$entity['ident']]['filename'] . ');" shadow="cast:true; receive:true"></a-entity>';
                } else {
                    echo '<a-entity class="cube" mixin="cube" position="' . join(" ", $entity['position']) . '" rotation="' . join(" ", $entity['rotation']) . '" material="color: #fff" shadow="cast:true; receive:true">
                            <a-box src="src: url(' . $assetlink . $assets['assets'][$entity['ident']]['filename'] . ');"
                                   position="0 .06 0" rotation="0 0 0" width=".09" depth=".005" height=".09" material="roughness:1"
                                   shadow="receive: true;"></a-box>
                        </a-entity>';
                }
            } else {
                echo '<a-entity class="cube" mixin="tile" position="' . join(" ", $entity['position']) . '" material="color: #ccc;">
                    <a-' . $assets['assets'][$entity['ident']]['type'] . '-model src="' . $assetlink . $assets['assets'][$entity['ident']]['filename'] . '" rotation="' . join(" ", $entity['rotation']) . '" scale="' . join(" ", $assets['assets'][$entity['ident']]['scale']) . '" shadow="cast: true; receive: true;"></a-' . $assets['assets'][$entity['ident']]['type'] . '-model>
                </a-entity>';
            }
        }
    ?>

    <a-entity light="
                       type:point;
                       shadowCameraVisible: false;
                       castShadow:true;
                       intensity:3;
                       shadowCameraTop:    10;
                       shadowCameraRight:  10;
                       shadowCameraLeft:  10;
                        decay: .5;" color="white" position="0 1 0" rotation="-90 0 0" shadow></a-entity>




    <a-entity wasd-controls="acceleration: 2">
        <a-entity id="cameraWrapper" height=".01" width=".01" depth=".01" position="0 0 1.8" rotation="-60 0 0">

            <a-camera id="cam"
                      capture-mouse
                      wasd-controls="enabled:false"
                      raycaster="objects: .cube" cursor="rayOrigin:mouse; fuse: false;"
                      super-hands="colliderEvent: raycaster-intersection;
                                 colliderEventProperty: els;
                                 colliderEndEvent:raycaster-intersection-cleared;
                                 colliderEndEventProperty: clearedEls;
                                    suppressY: true;">
            </a-camera>
            <!-- <a-entity id="camera" position="0 1 .5" camera wasd-controls  look-controls></a-entity>-->
        </a-entity>
    </a-entity>
<!-- orbit-controls="
            target: #table;
            enableDamping: true;
            dampingFactor: 0.125;
            rotateSpeed:1;
            rotateToSpeed: 0.25;
            rotateTo: 0 0 0;
            logPosition: true;
            enableZoom: true;
            "-->
</a-scene>
</body>
</html>