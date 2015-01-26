(function (global, factory) {
  if (typeof module === 'object' && typeof module.exports === 'object') {
    module.exports = function (global) {
      var core = require('./core.js');
      var ajax = require('./ajax.js');
      var $ = ajax(global);
      return factory(global, core, $);
    };
  } else {
    factory(global, global._, global.$);
  }
}(this, function (global, _, $) {
  'use strict';

  var window = global.window;
  var unsafeWindow = global.unsafeWindow;
  var document = window.document;


  $.removeAllTimer = function () {
    var handle = window.setInterval(_.nop, 10);
    while (handle > 0) {
      window.clearInterval(handle--);
    }
    handle = window.setTimeout(_.nop, 10);
    while (handle > 0) {
      window.clearTimeout(handle--);
    }
  };

  $.captcha = function (imgSrc, cb) {
    if (!config.externalServerSupport) {
      return;
    }

    var a = document.createElement('canvas');
    var b = a.getContext('2d');
    var c = new Image();
    c.src = imgSrc;
    c.onload = function () {
      a.width = c.width;
      a.height = c.height;
      b.drawImage(c, 0, 0);
      var d = a.toDataURL();
      var e = d.substr(d.indexOf(',') + 1);
      $.post('http://www.wcpan.info/cgi-bin/captcha.cgi', {
        i: e,
      }, cb);
    };
  };


  // Firefox only
  function injectClone (vaccine) {
    return cloneInto(vaccine, unsafeWindow, {
      cloneFunctions: true,
      wrapReflectors: true,
    });
  }

  // Firefox only
  function injectFunction (vaccine) {
    return exportFunction(vaccine, unsafeWindow, {
      allowCrossOriginArguments: true,
    });
  }

  // Firefox only
  function injectReference () {
    return new unsafeWindow.Object();
  }

  // Firefox only
  function inject (vaccine) {
    var type = typeof vaccine;
    if (type === 'function') {
      return injectFunction(vaccine);
    } else if (type === 'undefined') {
      return injectReference();
    } else if (vaccine !== null && type === 'object') {
      return injectClone(vaccine);
    } else {
      return vaccine;
    }
  }

  // magic property to get the proxy target
  var MAGIC_KEY = '__adsbypasser_metamagic__';

  $.window = (function () {
    var isFirefox = typeof InstallTrigger !== 'undefined';
    if (!isFirefox) {
      // other browsers does not need this
      return unsafeWindow;
    }

    var decorator = {
      set: function (target, key, value) {
        if (key === MAGIC_KEY) {
          return;
        }
        target[key] = inject(value);
      },
      get: function (target, key) {
        if (key === MAGIC_KEY) {
          return target;
        }
        var value = target[key];
        var type = typeof value;
        if (value === null || (type !== 'function' && type !== 'object')) {
          // primitive values does not need this
          return value;
        }
        return new Proxy(value, decorator);
      },
      apply: function (target, self, args) {
        // special hack for Object.defineProperty
        if (typeof self !== 'undefined' && self[MAGIC_KEY] === unsafeWindow.Object && target.name === 'defineProperty') {
          args[0] = args[0][MAGIC_KEY];
        }
        var usargs = new unsafeWindow.Array();
        _.C(args).each(function (v, i) {
          usargs.push(inject(v));
        });
        return target.apply(self, usargs);
      },
      construct: function (target, args) {
        args = Array.prototype.slice.call(args);
        args.unshift(undefined);
        var bind = unsafeWindow.Function.prototype.bind;
        return new (bind.apply(target, inject(args)));
      },
    };
    return new Proxy(unsafeWindow, decorator);
  })();


  return $;

}));


// ex: ts=2 sts=2 sw=2 et
// sublime: tab_size 2; translate_tabs_to_spaces true; detect_indentation false; use_tab_stops true;
// kate: space-indent on; indent-width 2;
