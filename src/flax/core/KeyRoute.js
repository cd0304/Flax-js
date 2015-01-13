/**
 * Created by cd0304 on 2015/1/12.
 * 实现键盘或者遥控器按键时，对焦点的控制
 * 如遥控器按 上下左右 确定 返回 等键时，能自动切换焦点动画，并实现焦点变化后的用户自定义回调函数处理
 */
var flax = flax || {};
flax.KeyCodes = {
    'BACK': 8,
    'ENTER': 'Z',
    'LEFT': 'A',
    'UP': 'W',
    'RIGHT': "D",
    'DOWN': 'S'
};

/**焦点路由，用于管理元素焦点*/
flax.FocusRouter = function (data) {
    var s = {};

    s._isValid = function (id) {
       //todo   可以增加是否隐藏的功能  isHide(id) ，未完成
        if (!id )return false;
        var route = this.routes[id];
        return route&&!route.disabled;
    };

    s._isHandled=function(type,id){
        return this.cb&&this.cb(type, id, this);
    };

    s._getGId = function (id) {
        var route = this.routes[id];
        if (route && route.group)
            return route.group;
        return 'root';
    };

    s._getBtn = function (option, index) {
        if (!option || !option.btn)
            return false;

       return option.btn;
    };
    s._setState = function(btn,index) {
        /** 调用flax的button类的方法*/
        if(index==0) btn.setState("down");
        else if(index==1)  btn.setState("up");
        else if(index==2)  btn.setState("SELECTED");
        else if(index==3)  btn.setState("up");
    };
    s._swapState = function (id,index) {
        var gid = this._getGId(id);
        if (index == 1) {
            /**如果当前元素被选中且不属于root组，失去焦点后应显示选中时的状态*/
            var sid = this.currentSelects[gid];
            if (sid == id&&gid!='root')index = 2;
        }

        var group = this.groups[gid];
        var btn = this._getBtn(group, index);
        if (btn){
           this._setState(btn,index);
        }

        var route = this.routes[id];
        btn = this._getBtn(route, index);
        if (btn){
            this._setState(btn,index);
        }
    };

    s._exec = function (id,index) {
        this._swapState(id,index);

        var group = this.groups[this._getGId(id)];
        if (group && group.fn) {
            var fn = group.fn[index];
            if (fn)fn(id, this);
        }

        var route = this.routes[id];
        if (route && route.fn) {
            var fn = route.fn[index];
            if (fn)fn(id, this);
        }
    };

    s.findNextValid=function(id,index){
        var route=this.routes[id];
        var next=route&&route.path?route.path[index]:false;

        if(!this.enableRecurFind||this._isValid(next)||
            this.recurCount==this.recurTotal){
            this.recurCount=0;
            return this._isValid(next)?next:false;
        }

        this.recurCount++;
        return this.findNextValid(next,index,this);
    };

    /**设置是否启用router*/
    s.enable=true;



    /**当前获取焦点的元素*/
    s.currentFocus = false;

    /**当前选中的元素，可能包含多个，格式为{gid:id}*/
    s.currentSelects = {};

    /**路由信息,格式如下：
     * id:{'path':[u,r,d,l],'fn':[f,b,s,u],'btn':btn,'group':'root','runscene':'scenename'}
     * id:可获取焦点的元素id，建议使用容易记忆的名称，如实例名字
     * path:元素焦点路由路径，u,r,d,l分别表示上，右，下，左
     * fn:(可选)元素路由事件回调函数，f,b,s,u分别对应4个路由事件onfocus,onblur,onselect,onunselect
     * btn:(必选) 对应flax创建的btn对象，一般是flash上对btn命名的实例
     * group:(可选)元素所属组，默认为root。具体见this.groups属性说明
     * runscene:(可选)选中元素后的目标跳转场景
     * disabled:(可选)此路由是否失效，默认为false
     *
     * 回调函数格式为:fn(id,router)
     * id:当前触发事件的元素id
     * router：当前router对象，可获取router.routes/router.groups等数据
     * */
    s.routes = data;

    /**元素分组信息，目前用于控制按钮组状态以及设置同一组元素的回调函数和按钮状态等，
     * 路由事件触发后会先执行分组信息定义的回调函数。格式如下：
     * gid:{'fn':[f,b,s,u],'btn':btn}
     * gid：组id，需要与路由信息的'group'属性值对应
     * fn定义与routes的定义相同
     * */
    s.groups = {};

    /**总回调函数，如果返回false，则不会执行默认操作.
     * 回调函数格式fn(type,id,router),参数说明如下：
     * type:需要执行的操作类型，可能为focus,blur,select,unselect
     * id:被操作的元素id值
     * router：当前FocusRouter对象
     * */
    s.cb = false;

    /**如果获取的下一个路由路径无效，总共允许迭代多少次以获取有效路径*/
    s.recurTotal=10;
    /**当前迭代查找有效路径的次数*/
    s.recurCount=0;
    /**是否启用迭代查找下一个有效路由*/
    s.enableRecurFind=true;

    /**设置路由失效、生效*/
    s.enableRoute = function (id, v) {
        var route = this.routes[id];
        if (route)route.disabled = !v;
    };

    /**元素获取焦点*/
    s.focus = function (id) {
        if(!this.enable||this._isHandled('focus', id))return;
        if (!this._isValid(id))return;
        if (this.currentFocus == id)return;

        this.blur(this.currentFocus);
        this.currentFocus = id;

        this._exec(id,0);
    };

    /**元素失去焦点*/
    s.blur = function (id) {
        if(!this.enable||this._isHandled('blur', id))return;
        if (!this._isValid(id))return;

        this.currentFocus = false;
        this._exec(id,1);
    };

    /**选中元素，如果元素未获取焦点，会先获取焦点*/
    s.select = function (id) {
        if(!this.enable||this._isHandled('select', id))return;
        if (!this._isValid(id))return;

        this.focus(id);

        var gid = this._getGId(id);
        var oldSelect = this.currentSelects[gid];

        /**如果当前选中元素属于root组，可以再次选中*/
        if (oldSelect == id&&gid!='root')return;

        if(oldSelect!=id){
            this.unselect(oldSelect);
            this.currentSelects[gid] = id;
        }
        //todo  如果flash的按钮有SELECTED状态，则应该执行，未完成
       // this._exec(id,2);
        var route = this.routes[id];
        if (route && route.runscene) {
           flax.replaceScene(route.runscene);
        }
    };

    /**取消选中元素，不会导致元素失去焦点*/
    s.unselect = function (id) {
        if(!this.enable||this._isHandled('unselect',id))return;
        if (!this._isValid(id))return;

        var gid = this._getGId(id);
        this.currentSelects[gid] = false;
        //todo flax的button类没有这个状态，未完成，暂时先用up代替,一般很少场景会有这样的状态
        this._exec(id,0);
    };

    /**根据传入的按键值移动元素焦点或选中元素*/
    s.go = function (key) {
        if(!this.enable)return ;

        var K = flax.KeyCodes;
        if (key == K.ENTER) {
            this.select(this.currentFocus);
            return;
        }

        var index = -1;
        if (key == K.UP) {index = 0}
        else if (key == K.RIGHT) {index = 1}
        else if (key == K.DOWN) {index = 2}
        else if (key == K.LEFT) {index = 3}
        else {return;}

        var id=this.findNextValid(this.currentFocus,index);
        this.focus(id);
    };

    return s;
};