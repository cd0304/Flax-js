/**
 * Created by long on 14-3-18.
 */

function showSplash() {
    lg.registerScene("splash", SplashScene.scene);
    lg.replaceScene("splash");
}
var SplashScene = cc.Layer.extend({
    onEnter:function()
    {
        this._super();
        var logo = cc.Sprite.create("res/a10/Splash_Image.png");
        logo.setScale(0.8);
        logo.setPosition(lg.stage.center());
        this.addChild(logo);
        logo.runAction(cc.FadeIn.create(0.5));
        this.scheduleOnce(function(){
            lg.replaceScene("mainMenu");
        }, 3);
        this.scheduleOnce(function(){
            logo.runAction(cc.FadeOut.create(0.5));
        }, 2.5);
        lg.inputManager.addListener(logo, goMoreGame);
    }
});
SplashScene.create = function()
{
    var s = new SplashScene();
    s.init();
    return s;
}
SplashScene.scene = function()
{
    var s = cc.Scene.create();
    s.addChild(SplashScene.create());
    return s;
}

function goMoreGame()
{
    if(a10Enabled) {
        var moreBtnAction = GameAPI.Branding.getLink("more_games");
        if(!moreBtnAction.error && moreBtnAction.action) {
            moreBtnAction.action();
        }
    }//window.open("http://a10.com");
    else window.open("http://longames.com");
}

function _fetchLogo(pos, parent, callback) {
    var logoData = GameAPI.Branding.getLogo();
    var logoTexture = new Image();
    logoTexture.src = logoData.image;
    if(logoData.width == null){
        var strArr = logoData.image.split("_");
        var wh = strArr[strArr.length - 1];
        strArr = wh.split(".png");
        wh = strArr[0];
        strArr = wh.split("x");
        logoData.width = parseInt(strArr[0]);
        logoData.height = parseInt((strArr[1]));
    }
    logoTexture.width = logoData.width;
    logoTexture.height = logoData.height;
    var handler;
    logoTexture.addEventListener("load", handler = function() {
        var texture2d = new cc.Texture2D();
        texture2d.initWithElement(logoTexture);
        texture2d.handleLoadedTexture();
        var logo = cc.Sprite.createWithTexture(texture2d);
        logo.setScale(cc.CONTENT_SCALE_FACTOR());
        this.removeEventListener('load', handler, false);
        parent.addChild(logo, 9999999);
        logo.setAnchorPoint(0, 0);
        logo.setPosition(pos);
        if(callback) callback.apply(parent, [logo, logoData.action]);
        lg.inputManager.addListener(logo, function(){
            logoData.action();
        });
    });
}

var LogoButton = lg.SimpleButton.extend({
    onEnter:function()
    {
        this._super();
        this.setVisible(false);
        if(a10Enabled) {
            _fetchLogo(cc.pAdd(this.getPosition(), cc.p(-20, 0)), this.getParent());
        }
    }
});
LogoButton.create = function(plistFile, assetID){
    var btn = new LogoButton();
    btn.setPlist(plistFile, assetID);
    return btn;
}

var MoreGameButton = lg.SimpleButton.extend({
    onEnter:function()
    {
        this._super();
        lg.inputManager.addListener(this, goMoreGame);
    }
});
MoreGameButton.create = function(plistFile, assetID){
    var btn = new MoreGameButton();
    btn.setPlist(plistFile, assetID);
    return btn;
}