(function() {
  if (!window.cordova)
    return;

  // Define and export nonRenewing
  var nonRenewing = window.nonRenewing = {};

  var log = function(txt) {
    console.log("[nonRenewing.js] " + txt);
  };

  // Create prefixed className from list of names, or a single names.
  //
  // examples:
  // ---------
  // className('bob')
  //   -> 'cordova-non-renewing-bob'
  // className(['alice', 'bbob'])
  //   -> 'cordova-non-renewing-alice cordova-non-renewing-bob'
  //
  var className = function(names) {
    if (typeof names == 'string')
      return 'cordova-non-renewing-' + names;
    else // array
      return names.map(className).join(' ');
  };

  var entityMap = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': '&quot;',
    "'": '&#39;',
    "/": '&#x2F;'
  };

  function escapeHtml(string) {
    return String(string).replace(/[&<>"'\/]/g, function (s) {
      return entityMap[s];
    });
  }

  var View = function(parent, eventsHandler) {
      this.eventsHandler = eventsHandler || function(){};
      this.el = document.createElement('div');
      this.el.className = className('root');
      this.el.style.position = 'absolute';
      this.el.style.top = 0;
      this.el.style.bottom = 0;
      this.el.style.left = 0;
      this.el.style.right = 0;
      this.el.style.backgroundColor = 'rgba(0,0,0,0.5)';
      this.hide();
      parent.appendChild(this.el);
  };

  View.prototype.show = function() {
    this.el.style.display = 'block';
  };

  View.prototype.hide = function() {
    this.el.style.display = 'none';
  };

  View.prototype.html = function(html) {
    this.el.innerHTML = html || '';
  };

  // var IOS_LIGHT_BLUE = '#54c7fc';
  var IOS_DARK_BLUE  = '#0076ff';
  var ANDROID_GREEN  = '#4CAF50';
  var ANDROID_LIGHT_GREEN = '#C8E6C9';
  var PRIMARY_TEXT_COLOR   = '#212121';
  var SECONDARY_TEXT_COLOR = '#727272';
  var SEPARATOR_COLOR = '#B6B6B6';

  var isAndroid = (navigator.userAgent.match(/Android/i)) == "Android";

  var buttonStyle = function() {
    if (isAndroid) {
      return 'text-decoration:none;' +
        'display: block;' +
        'background-color: ' + ANDROID_GREEN + ';' +
        'padding: 0.5em;' +
        'margin-bottom: 1em;' +
        'text-transform: uppercase;' +
        'color: white;';
    }
    else { // Default style / iOS
      return 'text-decoration:none;' +
        'color:' + IOS_DARK_BLUE + ';';
    }
  };

  var subtitleStyle = function() {
    return 'color: ' + PRIMARY_TEXT_COLOR + ';';
  };

  var titleStyle = function() {
    if (isAndroid)
      return 'margin-left:-1em; margin-right:-1em; padding:1em; color:' + PRIMARY_TEXT_COLOR + '; background-color:' + ANDROID_LIGHT_GREEN + ';';
    else
      return 'color: ' + PRIMARY_TEXT_COLOR + ';';
  };

  var Templates = {

    el: function(type, baseClass, content, extraClass, style) {
      var cname = extraClass ? className(baseClass, extraClass) : className(baseClass);
      return '<' + type + ' class="' + cname + '" style="' + style + '">' + content + '</' + type + '>';
    },

    title: function(content, extraClass) {
      return this.el('h3', 'title', content, extraClass, titleStyle());
    },

    subtitle: function(content, extraClass) {
      return this.el('h5', 'subtitle', content, extraClass, 'margin-bottom:0;' + subtitleStyle());
    },

    primaryMessage: function(content, extraClass, extraStyle) {
      var cname = extraClass ? className("message", extraClass) : className("message");
      var style = 'font-size:0.9em; color:' + PRIMARY_TEXT_COLOR + '; font-weight:bold;';
      if (extraStyle)
        style += extraStyle;
      return '<p style="' + style + '" class="' + cname + '">' + content + '</p>';
    },

    message: function(content, extraClass, extraStyle) {
      var cname = extraClass ? className("message", extraClass) : className("message");
      var style = 'font-size:0.9em; color:' + SECONDARY_TEXT_COLOR + ';';
      if (extraStyle)
        style += extraStyle;
      return '<p style="' + style + '" class="' + cname + '">' + content + '</p>';
    },

    separator: function() {
      return this.el('div', 'separator', '', null, 'height:1px; margin: 0.2em 0; background-color:' + SEPARATOR_COLOR + ';');
    },

    button: function(label, cname, extraStyle) {
      var style = buttonStyle();
      if (extraStyle)
        style += extraStyle;
      return '<p class="' + className(cname) + '"><a style="' + style + '" href="#" class="' + className(cname + '-link') + '">' + label + '</a></p>';
    },

    cancelButton: function() {
      return this.button('Cancel', 'cancel');
    },

    closeButton: function() {
      return this.button('Close', 'close');
    },

    dialogBox: function(innerHTML) {
      var innerStyle =
        'position:absolute;' +
        'padding:1em;' +
        'top:50%;' +
        'left:50%;' +
        'transform:translateX(-50%) translateY(-50%);' +
        '-webkit-transform:translateX(-50%) translateY(-50%);' +
        'background-color:white;' +
        'border-radius:0.7em;' +
        'min-width: 14.5em;' +
        'text-align:center';
      return '<div class="' + className('dialog-box') + '" style="' + innerStyle + '">' + innerHTML + '</div>';
    },

    errorScreen: function(message) {
      var title = this.title('Error');
      var content = this.message(escapeHtml(message), 'error');
      return this.dialogBox(title + content + this.closeButton());
    },

    loadingScreen: function(message) {
      return this.dialogBox(this.message('Loading...', 'loading'));
    },

    statusScreen: function(data) {
      var title = this.title('Subscription Status');
      var content = '';
      if (data.subscriber) {
        content += this.primaryMessage('Subscribed', null);
        content += this.message('Expiry Date:<br/>' + data.expiryDate);
        content += this.button('Extend your subscription', 'renew', 'font-weight:bold;');
      }
      else if (data.expired) {
        content += this.primaryMessage('Subscription Expired', null);
        content += this.message('Expiry Date:<br/>' + data.expiryDate);
        content += this.button('Renew your subscription', 'renew', 'font-weight:bold;');
      }
      else {
        content += this.primaryMessage('Not Subscribed', null);
        content += this.button('Subscribe now!', 'renew', 'font-weight:bold;');
      }
      return this.dialogBox(title + content + this.closeButton());
    },

    productsScreen: function(products) {
      var title = this.title('Subscription Products');
      var content = '';
      for (var i = 0; i < products.length; ++i) {
        content += this.subtitle(escapeHtml(products[i].title));
        content += this.message(escapeHtml(products[i].description));
        content += this.button(products[i].price, 'buy-' + i, 'font-weight:bold');
        content += this.separator();
      }
      return this.dialogBox(title + content + this.cancelButton());
    }
  };

  View.prototype.bindEvents = function() {

    var bindEvent = function(cname, event, fn) {
      var el = document.getElementsByClassName(className(cname));
      if (!el || el.length <= 0)
        return;
      el[0].addEventListener(event, fn.bind(this));
    }.bind(this);

    var bindButtonClick = function(cname) {
      bindEvent(cname + '-link', 'click', function(event) {
        event.preventDefault();
        this.eventsHandler(cname);
      });
    };

    var buttons = ['cancel', 'close', 'renew'];
    for (var i = 0; i <= 9; ++i)
      buttons.push('buy-' + i);
    buttons.forEach(bindButtonClick);
  };

  View.prototype.showError = function(err) {
    this.name = 'error';
    this.html(Templates.errorScreen(err));
    this.bindEvents();
    this.show();
  };

  View.prototype.showLoading = function() {
    this.name = 'loading';
    this.html(Templates.loadingScreen());
    this.show();
  };

  View.prototype.showStatus = function(data) {
    this.name = 'status';
    this.html(Templates.statusScreen(data));
    this.bindEvents();
    this.show();
  };

  View.prototype.showProducts = function(products) {
    this.name = 'products';
    this.html(Templates.productsScreen(products));
    this.bindEvents();
    this.show();
  };

  var Controller = function(options) {
    this.view = options.view;
    window.store.verbosity = options.verbosity || window.store.INFO;
    this.expiryStore = new ExpiryStore(options.loadExpiryDate, options.saveExpiryDate);
    this.expiryStore.onChange = this.dispatchStatusChange.bind(this);
    this.registerProducts(options.products);
    this.registerHandlers();
    window.store.refresh();
  };

  Controller.prototype.dispatchStatusChange = function() {
    this.loadStatus(function(err, status) {
      if (this.onStatusChange)
        this.onStatusChange(status);
    }.bind(this));
  };

  Controller.prototype.registerProducts = function(products) {
    this.productsById = {};
    this.products = products;
    for (var i = 0; i < products.length; ++i) {
      window.store.register({
        id: products[i].id,
        type: window.store.NON_RENEWING_SUBSCRIPTION,
        duration: products[i].duration
      });
      this.productsById[products[i].id] = products[i];
    }
  };

  Controller.prototype.registerHandlers = function() {

    window.store.when("product").updated(function(p) {
      log("Product updated: " + p.id + " (" + p.state + ")");

      // Warn about invalid products
      if (p.state == window.store.INVALID) {
        log("Product " + p.id + " can't be loaded from the store.");
        // this.products[p.id];
      }

      if (p.state == window.store.APPROVED) {
        this.deliverOrder(p);
      }
    }.bind(this));

    window.store.error(function(err) {
      this.view.showError(err.message);
    }.bind(this));

    window.store.when("product").cancelled(function(p) {
      this.view.hide();
    }.bind(this));
  };

  Controller.prototype.deliverOrder = function(p) {
    var nrProduct = this.productsById[p.id];
    if (!nrProduct) {
      // Unknown product type. Cleaning up.
      p.finish();
      return;
    }

    this.expiryStore.load(function(err, expiryDate) {
      if (err) {
        return this.view.showError("Can't process subscription: " + err);
      }
      var now = +new Date();
      if (!expiryDate || expiryDate < now)
        expiryDate = now;
      expiryDate = expiryDate + nrProduct.duration * 1000;

      this.expiryStore.save(expiryDate, function(err) {
        if (err)
          return this.view.showError("Can't process subscription: " + err);
        log("finishing " + p.id);
        p.finish();
        this.openStatusView();
      }.bind(this));
    }.bind(this));
  };

  Controller.prototype.reset = function() {
    this.expiryStore.reset();
  };

  Controller.prototype.loadStatus = function(cb) {
    this.expiryStore.load(function(err, expiryDate) {
      if (expiryDate > 0) {
        var now = +new Date();
        cb(null, {
          expiryDate: new Date(expiryDate).toLocaleDateString() + " at " + new Date(expiryDate).toLocaleTimeString(),
          expiryTimestamp: expiryDate,
          subscriber: now <= expiryDate,
          expired:    now > expiryDate
        });
      }
      else {
        cb(err, {
          expiryDate: null,
          expiryTimestamp: null,
          subscriber: false,
          expired:    false
        });
      }
    });
  };

  Controller.prototype.loadProducts = function(cb) {
    cb(null, this.products.map(function(p) {
      return window.store.get(p.id);
    }));
  };

  Controller.prototype.openStatusView = function() {
    this.view.showLoading();
    this.loadStatus(function(err, status) {
      if (err)
        return this.view.showError(err);
      this.view.showStatus(status);
    }.bind(this));
  };

  Controller.prototype.openProductsView = function() {
    this.view.showLoading();
    this.loadProducts(function(err, products) {
      if (err)
        return this.view.showError(err);
      this.view.showProducts(products);
    }.bind(this));
  };

  Controller.prototype.purchase = function(id) {
    this.view.showLoading();
    window.store.order(id);
  };

  Controller.prototype.eventsHandler = function(eventName) {

    log("Event " + eventName);
    if (eventName == 'close') {
      this.view.hide();
    }

    if (eventName == 'cancel') {
      if (this.view.name == 'products')
        this.openStatusView();
    }

    if (eventName == 'renew') {
      this.openProductsView();
    }

    if (eventName.slice(0,4) == 'buy-') {
      var index = +eventName.slice(4);
      log("Purchase product at index " + index);
      this.purchase(this.products[index].id);
    }

  };

  // The subscription status needs to be stored on a server, linked to a user.
  // I won't assume anything about what you have in place.
  //
  // The lib will use user provided callbacks:
  //   - saveExpiryDate(expiryDate, function(err) {})
  //   - loadExpiryDate(function(err, expiryDate) { ... })
  var ExpiryStore = function(load, save) {

    // Change cached value of the expiry date.
    // Trigger "onChange" if the value has changed.
    var setExpiryDate = function(value) {
      if (!isNaN(value) && value !== null && this.expiryDate !== value) {
        this.expiryDate = value;
        if (this.onChange) {
          setTimeout(this.onChange, 0);
        }
      }
    }.bind(this);

    // Returns the value of the expiry date.
    var getExpiryDate = function() {
      return this.expiryDate;
    }.bind(this);

    // set load default to localStorage
    load = load || function(cb) {
      cb(null, localStorage.cordovanonrsdate);
    };

    // set save default to localStorage
    save = save || function(value, cb) {
      localStorage.cordovanonrsdate = value;
      cb(null);
    };

    // Create a version of 'load' that makes sure expiryDate is a
    // number. And caches the loaded value.
    this.load = function(cb) {
      if (getExpiryDate())
        return cb(null, getExpiryDate());
      load(function(err, expiryDate) {
        setExpiryDate(+expiryDate);
        cb(err, +expiryDate);
      });
    };

    // Save, update the cache.
    this.save = function(value, cb) {
      setExpiryDate(+value);
      save(value, cb);
    };

    // Cleanup the cache
    this.reset = function() {
      setExpiryDate(undefined);
    };
  };

  nonRenewing.initialize = function(options) {

    this.view = new View(document.body);

    if (!window.store) {
      this.view.showError('The in-app purchase plugin is not available.');
      return;
    }

    this.controller = new Controller({
      verbosity: options.verbosity,
      products:  options.products,
      loadExpiryDate: options.loadExpiryDate,
      saveExpiryDate: options.saveExpiryDate,
      view:      this.view
    });

    this._statusChangeCallbacks = [];
    this.controller.onStatusChange = function(status) {
      this._statusChangeCallbacks.forEach(function(cb) {
        cb(status);
      });
    }.bind(this);

    this.view.eventsHandler = this.controller.eventsHandler.bind(this.controller);
  };

  nonRenewing.openSubscriptionManager = function() {
    this.controller.openStatusView();
  };

  nonRenewing.getStatus = function(callback) {
    this.controller.loadStatus(callback);
  };

  nonRenewing.reset = function() {
    this.controller.reset();
  };

  nonRenewing.onStatusChange = function(cb) {
    this._statusChangeCallbacks.push(cb);
    this.getStatus(function(err, status) { cb(status); });
  };

}).apply(this);
// vim: ts=2:sw=2:et:
