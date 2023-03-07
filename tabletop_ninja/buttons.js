
function handleDrop(e) {

    var dt = e.dataTransfer,
        files = dt.files;
    if (files.length) {
        handleFiles(files);
    } else {
        var html = dt.getData('text/html'),
            match = html && /\bsrc="?([^"\s]+)"?\s*/.exec(html),
            url = match && match[1];
        if (url) {
            uploadImageFromURL(url);
            return;
        }
    }
    function uploadImageFromURL(url) {
        var img = new Image;
        var c = document.createElement("canvas");
        var ctx = c.getContext("2d");
        img.onload = function() {
            c.width = this.naturalWidth;
            c.height = this.naturalHeight;
            ctx.drawImage(this, 0, 0);
            c.toBlob(function(blob) {
                handleFiles( [blob] );
            }, "image/png");
        };
        img.onerror = function() {
            alert("Error in uploading");
        }
        img.crossOrigin = "";
        img.src = url;
    }
}


function handleFiles(files) {
    for (var i = 0, len = files.length; i < len; i++) {
        if (validateImage(files[i]))
            previewAnduploadImage(files[i]);
    }
}

function validateImage(image) {
    // check the type
    var validTypes = ['image/jpeg', 'image/png', 'image/gif'];
    if (validTypes.indexOf( image.type ) === -1) {
        alert("Invalid File Type");
        return false;
    }

    // check the size
    var maxSizeInBytes = 10e6; // 10MB
    if (image.size > maxSizeInBytes) {
        alert("File too large");
        return false;
    }
    return true;
}

function previewAnduploadImage(image) {
    if (localconfig.myrole === "host") {
        let pcount = $('.element-image img').length;
        let randcol = '#' + generateUniqueId();
        let img = makeImageSpace(pcount, '', 1, 1, 1, randcol, 0);
        // read the image...
        var reader = new FileReader();
        reader.onload = function (e) {
            let foundownimage = false;
            for(let i = 0; i < globalconfig.elm.imgsrc.length; i++) if (globalconfig.elm.imgsrc[i] === e.target.result) foundownimage = true;

            if (!foundownimage) {
                img.src = e.target.result;
                let playerid = generateUniqueId();

                globalconfig.elm.id.push(playerid);
                globalconfig.elm.name.push(fantasy_names[Math.floor(Math.random() * fantasy_names.length)]);
                globalconfig.elm.pos.push({x: 1, y: 1});
                globalconfig.elm.imgsrc.push(e.target.result);
                globalconfig.elm.color.push(randcol);
                globalconfig.elm.isplayer.push(0);
                globalconfig.elm.visible.push(0);
                globalconfig.elm.size.push(1);
                globalconfig.elm.type.push('npc');
                // Strength, dexterity, constitution, intelligence, wisdom, charisma, divine sense, sanity
                globalconfig.elm.values.push({str: 0, dex: 0, con: 0, int: 0, wis: 0, cha: 0, div: 0, san: 0});
                send('all', 'elements', globalconfig.elm);
                localStorage.setItem(localstorage_prefix + '.globalconfig', JSON.stringify(globalconfig));
            }
        }
        reader.readAsDataURL(image);
    } else {
        if (localconfig.myplayerid > -1 ) {
            let img = $('#player_'+localconfig.myplayerid+' img');
            var reader = new FileReader();
            reader.onload = function (e) {
                let foundownimage = false;
                for(let i = 0; i < globalconfig.elm.imgsrc.length; i++) if (globalconfig.elm.imgsrc[i] === e.target.result) foundownimage = true;

                if (!foundownimage) {
                    img.attr('src', e.target.result);
                    globalconfig.elm.imgsrc[localconfig.myplayerid] = e.target.result;
                    send('all', 'elementimages', globalconfig.elm.imgsrc);
                    localStorage.setItem(localstorage_prefix + '.globalconfig', JSON.stringify(globalconfig));
                }
            }
            reader.readAsDataURL(image);
        }
    }
}

function makeImageSpace(id, myhostid, posx, posy, size, mycolor, visible) {
    // container
    var imgView = document.createElement("div");
    imgView.id = 'player_'+id;
    imgView.className = "element-image";
    imgView.style = "position: absolute; top: "+(((localconfig.grid_x*localconfig.grid_y) * posy) + (globalconfig.tableconfig.gridpos_y * (localconfig.grid_x*localconfig.grid_y)))+"px; left: "+((localconfig.grid_x * posx) + (globalconfig.tableconfig.gridpos_x * localconfig.grid_x))+"px;" + (visible?"":(localconfig.myrole=='host'?"opacity:.5;":"display:none;"));
    imagePreviewRegion.appendChild(imgView);
    var img = document.createElement("img");
    img.style = "background:transparent;border: 5px solid " + mycolor + "; width: " + (size * localconfig.grid_x) + "px; height: " + (size * Math.floor(localconfig.grid_x*localconfig.grid_y)) + "px;";
    imgView.appendChild(img);

    if (localconfig.myrole === 'host' || myhostid === localconfig.hostid ) {
        $(imgView).draggable({grid: [localconfig.grid_x, Math.floor(localconfig.grid_x*localconfig.grid_y)], stop: function(){
                let i = $(this);
                let ss = i.attr('id').split('_');
                globalconfig.elm.pos[parseInt(ss[1])].x = Math.floor(i.position().left / localconfig.grid_x);
                globalconfig.elm.pos[parseInt(ss[1])].y = Math.floor(i.position().top / Math.floor(localconfig.grid_x*localconfig.grid_y));
                send('all', 'elementpositions', globalconfig.elm.pos);
                globalconfig.tableconfig.boxcount_x
            }});
    }
    localStorage.setItem(localstorage_prefix + '.globalconfig', JSON.stringify(globalconfig));
    return img;
}

// Created by STRd6
// MIT License
// jquery.paste_image_reader.js
(function($) {
    var defaults;
    $.event.fix = (function(originalFix) {
        return function(event) {
            event = originalFix.apply(this, arguments);
            if (event.type.indexOf('copy') === 0 || event.type.indexOf('paste') === 0) {
                event.clipboardData = event.originalEvent.clipboardData;
            }
            return event;
        };
    })($.event.fix);
    defaults = {
        callback: $.noop,
        matchType: /image.*/
    };
    return $.fn.pasteImageReader = function(options) {
        if (typeof options === "function") {
            options = {
                callback: options
            };
        }
        options = $.extend({}, defaults, options);
        return this.each(function() {
            var $this, element;
            element = this;
            $this = $(this);
            return $this.bind('paste', function(event) {
                var clipboardData, found;
                found = false;
                clipboardData = event.clipboardData;
                return Array.prototype.forEach.call(clipboardData.types, function(type, i) {
                    var file, reader;
                    if (found) {
                        return;
                    }
                    if (type.match(options.matchType) || clipboardData.items[i].type.match(options.matchType)) {
                        file = clipboardData.items[i].getAsFile();
                        reader = new FileReader();
                        reader.onload = function(evt) {
                            return options.callback.call(element, {
                                dataURL: evt.target.result,
                                event: evt,
                                file: file,
                                name: file.name
                            });
                        };
                        reader.readAsDataURL(file);
                        return found = true;
                    }
                });
            });
        });
    };
})(jQuery);

$("html").pasteImageReader(function(results) {
    if (tablestarted) {
        let foundownimage = false;
        for (let i = 0; i < globalconfig.elm.imgsrc.length; i++) if (globalconfig.elm.imgsrc[i] === results.dataURL) foundownimage = true;

        if (!foundownimage) {

            if (localconfig.myrole === "host") {
                let pcount = $('.element-image img').length;
                let randcol = '#' + generateUniqueId();
                let img = makeImageSpace(pcount, '', 1, 1, 1, randcol, 0);
                img.src = results.dataURL;
                let playerid = generateUniqueId();

                globalconfig.elm.id.push(playerid);
                globalconfig.elm.name.push(fantasy_names[Math.floor(Math.random() * fantasy_names.length)]);
                globalconfig.elm.pos.push({x: 1, y: 1});
                globalconfig.elm.imgsrc.push(img.src);
                globalconfig.elm.color.push(randcol);
                globalconfig.elm.isplayer.push(0);
                globalconfig.elm.visible.push(0);
                globalconfig.elm.size.push(1);
                globalconfig.elm.type.push('npc');
                // Strength, dexterity, constitution, intelligence, wisdom, charisma, divine sense, sanity
                globalconfig.elm.values.push({str: 0, dex: 0, con: 0, int: 0, wis: 0, cha: 0, div: 0, san: 0});
                send('all', 'elements', globalconfig.elm);
                localStorage.setItem(localstorage_prefix + '.globalconfig', JSON.stringify(globalconfig));
            } else {
                if (localconfig.myplayerid > -1) {
                    let img = $('#player_' + localconfig.myplayerid + ' img');
                    img.attr('src', results.dataURL);
                    globalconfig.elm.imgsrc[localconfig.myplayerid] = results.dataURL;
                    send('all', 'elementimages', globalconfig.elm.imgsrc);
                    localStorage.setItem(localstorage_prefix + '.globalconfig', JSON.stringify(globalconfig));
                }
            }
        }
    }
});
