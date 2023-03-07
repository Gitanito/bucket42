
function s(address, msg)
{
    //console.log(initedPlayers);
    console.log(localconfig.chatserver + localconfig.tableroom  + '-' + address + localconfig.inout[1] + " " + JSON.stringify(msg));
    if (localconfig.myrole == "player" || $.inArray(address, localconfig.initedPlayers) !== -1) {
        $.post(localconfig.chatserver + localconfig.tableroom + '-' + address + localconfig.inout[1], JSON.stringify(msg), function (data) {
            //console.log(data);
        });
    }
}

function send(audience, msgtype, obj)
{
    //console.log(obj);
    if (localconfig.myrole === 'host') {
        if (audience === 'all') {
            for (let i = 0; i < globalconfig.elm.id.length; i++) {
                s(globalconfig.elm.id[i], {audience: audience, type: msgtype, msg: obj});
            }
        } else {
            s(audience, {audience: audience, type: msgtype, msg: obj});
        }
    } else {
        s(localconfig.hostid, {audience: audience, type: msgtype, msg: obj});
    }
}