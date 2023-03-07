let colors = [
    "transparent", // transparent
    "#067BC2", // blue
    "#F37748", // orange
    "#9D8DF1", // lila
    "#ECC30B", // yellow
    "#1CFEBA", // green
    "#613F75", // purple
    "#84BCDA", // lightblue
    "#D56062", // red
    "#0B6E4F", // hunter
    "#FA9F42", // sun
    "#49111C", // darkred
    "#A9927D", // wood
    "#EF798A", // flesh
    "#482728" // brown
];

let fantasy_names = ["Nichye","Ealdrert","Pharder","Olhean","Agnorht","Thelmund","Wulfa","Grewill","Grichye","Arnulf","Wilfre",
    "Ealdwulf","Aerert","Wulfa","Andes","Anthol","Here","Duca","Rarder","Hany","Nichye","Wulfa","Aecthert","Bryany",
    "Hunfre","Ered","Thury","Walda","Aldwith"];
let loadlocalconfig = false;
let dropRegion = null;
let imagePreviewRegion = null;
let localstorage_prefix = "vttninja";
let tablestarted = false;
let jitsiapi = null;

let localconfig = {};
localconfig.grid_x = 96;
localconfig.grid_y = 1.0;
localconfig.inout = ['in','out'];
localconfig.chatsalt = "/ttninja";
localconfig.chatserver = "https://ppng.io"+localconfig.chatsalt;
localconfig.chatrooms = [];
localconfig.initedPlayers = [];
localconfig.tableroom = 0;
localconfig.myrole = 'none';
localconfig.hostid = '';
localconfig.activeelement = -1;
localconfig.myplayerid = -1;

let globalconfig = {};
globalconfig.bg_is_video = false;
globalconfig.background = "";
globalconfig.tableconfig = {};
globalconfig.tableconfig.boxcount_x = 15.0;
globalconfig.tableconfig.gridpos_x = 0.5;
globalconfig.tableconfig.gridpos_y = 0.5;
globalconfig.tableconfig.grid_visible = true;
globalconfig.tableconfig.grid_black = true;
globalconfig.tableconfig.video_aspect_ratio = .5625;
globalconfig.tableconfig.activatevideochat = false;
globalconfig.chatmessages = [];
globalconfig.elm = {};
globalconfig.elm.id = [];
globalconfig.elm.name = [];
globalconfig.elm.imgsrc = [];
globalconfig.elm.color = [];
globalconfig.elm.pos = [];
globalconfig.elm.isplayer = [];
globalconfig.elm.visible = [];
globalconfig.elm.size = [];
globalconfig.elm.values = [];
globalconfig.elm.type = []; // can be 'item', 'npc', 'player', 'watcher'
globalconfig.pluginlisteners = {};
//globalconfig.gitcdnurl = "https://cdn.jsdelivr.net/gh/";
//globalconfig.plugins = [
//    'Gitanito/bucket42/tabletop_ninja/plugin/dice',
//    'Gitanito/bucket42/tabletop_ninja/plugin/jitsi'
//];

globalconfig.gitcdnurl = "http://localhost/";
globalconfig.plugins = [
    'bucket42/tabletop_ninja/plugin/dice',
    'bucket42/tabletop_ninja/plugin/jitsi'
];