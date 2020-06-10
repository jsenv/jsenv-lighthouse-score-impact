import { createRequire } from 'module';
import { pathToFileURL, fileURLToPath } from 'url';
import { promises, readFile as readFile$2, constants, chmod, stat as stat$2, lstat, readdir, createReadStream } from 'fs';
import { createHash } from 'crypto';
import { extname } from 'path';
import { promisify } from 'util';
import { exec as exec$1 } from 'child_process';
import { Agent } from 'https';
import 'net';
import 'http';
import 'stream';
import 'os';

// eslint-disable-next-line consistent-return
var arrayWithHoles = (function (arr) {
  if (Array.isArray(arr)) return arr;
});

var iterableToArrayLimit = (function (arr, i) {
  // this is an expanded form of \`for...of\` that properly supports abrupt completions of
  // iterators etc. variable names have been minimised to reduce the size of this massive
  // helper. sometimes spec compliance is annoying :(
  //
  // _n = _iteratorNormalCompletion
  // _d = _didIteratorError
  // _e = _iteratorError
  // _i = _iterator
  // _s = _step
  if (typeof Symbol === "undefined" || !(Symbol.iterator in Object(arr))) return;
  var _arr = [];
  var _n = true;
  var _d = false;

  var _e;

  var _i = arr[Symbol.iterator]();

  var _s;

  try {
    for (; !(_n = (_s = _i.next()).done); _n = true) {
      _arr.push(_s.value);

      if (i && _arr.length === i) break;
    }
  } catch (err) {
    _d = true;
    _e = err;
  } finally {
    try {
      if (!_n && _i.return !== null) _i.return();
    } finally {
      if (_d) throw _e;
    }
  } // eslint-disable-next-line consistent-return


  return _arr;
});

/* eslint-disable no-eq-null, eqeqeq */
function arrayLikeToArray(arr, len) {
  if (len == null || len > arr.length) len = arr.length;
  var arr2 = new Array(len);

  for (var i = 0; i < len; i++) {
    arr2[i] = arr[i];
  }

  return arr2;
}

/* eslint-disable consistent-return */
function unsupportedIterableToArray(o, minLen) {
  if (!o) return;
  if (typeof o === "string") return arrayLikeToArray(o, minLen);
  var n = Object.prototype.toString.call(o).slice(8, -1);
  if (n === "Object" && o.constructor) n = o.constructor.name;
  if (n === "Map" || n === "Set") return Array.from(n);
  if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return arrayLikeToArray(o, minLen);
}

var nonIterableRest = (function () {
  throw new TypeError("Invalid attempt to destructure non-iterable instance.\\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
});

var _slicedToArray = (function (arr, i) {
  return arrayWithHoles(arr) || iterableToArrayLimit(arr, i) || unsupportedIterableToArray(arr, i) || nonIterableRest();
});

var LOG_LEVEL_OFF = "off";
var LOG_LEVEL_DEBUG = "debug";
var LOG_LEVEL_INFO = "info";
var LOG_LEVEL_WARN = "warn";
var LOG_LEVEL_ERROR = "error";

var createLogger = function createLogger() {
  var _ref = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {},
      _ref$logLevel = _ref.logLevel,
      logLevel = _ref$logLevel === void 0 ? LOG_LEVEL_INFO : _ref$logLevel;

  if (logLevel === LOG_LEVEL_DEBUG) {
    return {
      debug: debug,
      info: info,
      warn: warn,
      error: error
    };
  }

  if (logLevel === LOG_LEVEL_INFO) {
    return {
      debug: debugDisabled,
      info: info,
      warn: warn,
      error: error
    };
  }

  if (logLevel === LOG_LEVEL_WARN) {
    return {
      debug: debugDisabled,
      info: infoDisabled,
      warn: warn,
      error: error
    };
  }

  if (logLevel === LOG_LEVEL_ERROR) {
    return {
      debug: debugDisabled,
      info: infoDisabled,
      warn: warnDisabled,
      error: error
    };
  }

  if (logLevel === LOG_LEVEL_OFF) {
    return {
      debug: debugDisabled,
      info: infoDisabled,
      warn: warnDisabled,
      error: errorDisabled
    };
  }

  throw new Error("unexpected logLevel.\n--- logLevel ---\n".concat(logLevel, "\n--- allowed log levels ---\n").concat(LOG_LEVEL_OFF, "\n").concat(LOG_LEVEL_ERROR, "\n").concat(LOG_LEVEL_WARN, "\n").concat(LOG_LEVEL_INFO, "\n").concat(LOG_LEVEL_DEBUG));
};
var debug = console.debug;

var debugDisabled = function debugDisabled() {};

var info = console.info;

var infoDisabled = function infoDisabled() {};

var warn = console.warn;

var warnDisabled = function warnDisabled() {};

var error = console.error;

var errorDisabled = function errorDisabled() {};

var _defineProperty = (function (obj, key, value) {
  // Shortcircuit the slow defineProperty path when possible.
  // We are trying to avoid issues where setters defined on the
  // prototype cause side effects under the fast path of simple
  // assignment. By checking for existence of the property with
  // the in operator, we can optimize most of this overhead away.
  if (key in obj) {
    Object.defineProperty(obj, key, {
      value: value,
      enumerable: true,
      configurable: true,
      writable: true
    });
  } else {
    obj[key] = value;
  }

  return obj;
});

function _objectSpread (target) {
  for (var i = 1; i < arguments.length; i++) {
    // eslint-disable-next-line prefer-rest-params
    var source = arguments[i] === null ? {} : arguments[i];

    if (i % 2) {
      // eslint-disable-next-line no-loop-func
      ownKeys(Object(source), true).forEach(function (key) {
        _defineProperty(target, key, source[key]);
      });
    } else if (Object.getOwnPropertyDescriptors) {
      Object.defineProperties(target, Object.getOwnPropertyDescriptors(source));
    } else {
      // eslint-disable-next-line no-loop-func
      ownKeys(Object(source)).forEach(function (key) {
        Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key));
      });
    }
  }

  return target;
} // This function is different to "Reflect.ownKeys". The enumerableOnly
// filters on symbol properties only. Returned string properties are always
// enumerable. It is good to use in objectSpread.

function ownKeys(object, enumerableOnly) {
  var keys = Object.keys(object);

  if (Object.getOwnPropertySymbols) {
    var symbols = Object.getOwnPropertySymbols(object);
    if (enumerableOnly) symbols = symbols.filter(function (sym) {
      return Object.getOwnPropertyDescriptor(object, sym).enumerable;
    }); // eslint-disable-next-line prefer-spread

    keys.push.apply(keys, symbols);
  }

  return keys;
}

var objectWithoutPropertiesLoose = (function (source, excluded) {
  if (source === null) return {};
  var target = {};
  var sourceKeys = Object.keys(source);
  var key;
  var i;

  for (i = 0; i < sourceKeys.length; i++) {
    key = sourceKeys[i];
    if (excluded.indexOf(key) >= 0) continue;
    target[key] = source[key];
  }

  return target;
});

var _objectWithoutProperties = (function (source, excluded) {
  if (source === null) return {};
  var target = objectWithoutPropertiesLoose(source, excluded);
  var key;
  var i;

  if (Object.getOwnPropertySymbols) {
    var sourceSymbolKeys = Object.getOwnPropertySymbols(source);

    for (i = 0; i < sourceSymbolKeys.length; i++) {
      key = sourceSymbolKeys[i];
      if (excluded.indexOf(key) >= 0) continue;
      if (!Object.prototype.propertyIsEnumerable.call(source, key)) continue;
      target[key] = source[key];
    }
  }

  return target;
});

var nativeTypeOf = function nativeTypeOf(obj) {
  return typeof obj;
};

var customTypeOf = function customTypeOf(obj) {
  return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj;
};

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? nativeTypeOf : customTypeOf;

var ensureUrlTrailingSlash = function ensureUrlTrailingSlash(url) {
  return url.endsWith("/") ? url : "".concat(url, "/");
};

var isFileSystemPath = function isFileSystemPath(value) {
  if (typeof value !== "string") {
    throw new TypeError("isFileSystemPath first arg must be a string, got ".concat(value));
  }

  if (value[0] === "/") return true;
  return startsWithWindowsDriveLetter(value);
};

var startsWithWindowsDriveLetter = function startsWithWindowsDriveLetter(string) {
  var firstChar = string[0];
  if (!/[a-zA-Z]/.test(firstChar)) return false;
  var secondChar = string[1];
  if (secondChar !== ":") return false;
  return true;
};

var fileSystemPathToUrl = function fileSystemPathToUrl(value) {
  if (!isFileSystemPath(value)) {
    throw new Error("received an invalid value for fileSystemPath: ".concat(value));
  }

  return String(pathToFileURL(value));
};

var assertAndNormalizeDirectoryUrl = function assertAndNormalizeDirectoryUrl(value) {
  var urlString;

  if (value instanceof URL) {
    urlString = value.href;
  } else if (typeof value === "string") {
    if (isFileSystemPath(value)) {
      urlString = fileSystemPathToUrl(value);
    } else {
      try {
        urlString = String(new URL(value));
      } catch (e) {
        throw new TypeError("directoryUrl must be a valid url, received ".concat(value));
      }
    }
  } else {
    throw new TypeError("directoryUrl must be a string or an url, received ".concat(value));
  }

  if (!urlString.startsWith("file://")) {
    throw new Error("directoryUrl must starts with file://, received ".concat(value));
  }

  return ensureUrlTrailingSlash(urlString);
};

var assertAndNormalizeFileUrl = function assertAndNormalizeFileUrl(value, baseUrl) {
  var urlString;

  if (value instanceof URL) {
    urlString = value.href;
  } else if (typeof value === "string") {
    if (isFileSystemPath(value)) {
      urlString = fileSystemPathToUrl(value);
    } else {
      try {
        urlString = String(new URL(value, baseUrl));
      } catch (e) {
        throw new TypeError("fileUrl must be a valid url, received ".concat(value));
      }
    }
  } else {
    throw new TypeError("fileUrl must be a string or an url, received ".concat(value));
  }

  if (!urlString.startsWith("file://")) {
    throw new Error("fileUrl must starts with file://, received ".concat(value));
  }

  return urlString;
};

var urlToFileSystemPath = function urlToFileSystemPath(fileUrl) {
  if (fileUrl[fileUrl.length - 1] === "/") {
    // remove trailing / so that nodejs path becomes predictable otherwise it logs
    // the trailing slash on linux but does not on windows
    fileUrl = fileUrl.slice(0, -1);
  }

  var fileSystemPath = fileURLToPath(fileUrl);
  return fileSystemPath;
};

var isWindows = process.platform === "win32";

var createCancellationToken = function createCancellationToken() {
  var register = function register(callback) {
    if (typeof callback !== "function") {
      throw new Error("callback must be a function, got ".concat(callback));
    }

    return {
      callback: callback,
      unregister: function unregister() {}
    };
  };

  var throwIfRequested = function throwIfRequested() {
    return undefined;
  };

  return {
    register: register,
    cancellationRequested: false,
    throwIfRequested: throwIfRequested
  };
};

var createOperation = function createOperation(_ref) {
  var _ref$cancellationToke = _ref.cancellationToken,
      cancellationToken = _ref$cancellationToke === void 0 ? createCancellationToken() : _ref$cancellationToke,
      start = _ref.start,
      rest = _objectWithoutProperties(_ref, ["cancellationToken", "start"]);

  var unknownArgumentNames = Object.keys(rest);

  if (unknownArgumentNames.length) {
    throw new Error("createOperation called with unknown argument names.\n--- unknown argument names ---\n".concat(unknownArgumentNames, "\n--- possible argument names ---\ncancellationToken\nstart"));
  }

  cancellationToken.throwIfRequested();
  var promise = new Promise(function (resolve) {
    resolve(start());
  });
  var cancelPromise = new Promise(function (resolve, reject) {
    var cancelRegistration = cancellationToken.register(function (cancelError) {
      cancelRegistration.unregister();
      reject(cancelError);
    });
    promise.then(cancelRegistration.unregister, function () {});
  });
  var operationPromise = Promise.race([promise, cancelPromise]);
  return operationPromise;
};

var createCancelError = function createCancelError(reason) {
  var cancelError = new Error("canceled because ".concat(reason));
  cancelError.name = "CANCEL_ERROR";
  cancelError.reason = reason;
  return cancelError;
};
var isCancelError = function isCancelError(value) {
  return value && _typeof(value) === "object" && value.name === "CANCEL_ERROR";
};

var arrayWithoutHoles = (function (arr) {
  if (Array.isArray(arr)) return arrayLikeToArray(arr);
});

// eslint-disable-next-line consistent-return
var iterableToArray = (function (iter) {
  if (typeof Symbol !== "undefined" && Symbol.iterator in Object(iter)) return Array.from(iter);
});

var nonIterableSpread = (function () {
  throw new TypeError("Invalid attempt to spread non-iterable instance.\\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
});

var _toConsumableArray = (function (arr) {
  return arrayWithoutHoles(arr) || iterableToArray(arr) || unsupportedIterableToArray(arr) || nonIterableSpread();
});

var arrayWithout = function arrayWithout(array, item) {
  var arrayWithoutItem = [];
  var i = 0;

  while (i < array.length) {
    var value = array[i];
    i++;

    if (value === item) {
      continue;
    }

    arrayWithoutItem.push(value);
  }

  return arrayWithoutItem;
};

var createCancellationSource = function createCancellationSource() {
  var requested = false;
  var cancelError;
  var registrationArray = [];

  var cancel = function cancel(reason) {
    if (requested) return;
    requested = true;
    cancelError = createCancelError(reason);
    var registrationArrayCopy = registrationArray.slice();
    registrationArray.length = 0;
    registrationArrayCopy.forEach(function (registration) {
      registration.callback(cancelError); // const removedDuringCall = registrationArray.indexOf(registration) === -1
    });
  };

  var register = function register(callback) {
    if (typeof callback !== "function") {
      throw new Error("callback must be a function, got ".concat(callback));
    }

    var existingRegistration = registrationArray.find(function (registration) {
      return registration.callback === callback;
    }); // don't register twice

    if (existingRegistration) {
      return existingRegistration;
    }

    var registration = {
      callback: callback,
      unregister: function unregister() {
        registrationArray = arrayWithout(registrationArray, registration);
      }
    };
    registrationArray = [registration].concat(_toConsumableArray(registrationArray));
    return registration;
  };

  var throwIfRequested = function throwIfRequested() {
    if (requested) {
      throw cancelError;
    }
  };

  return {
    token: {
      register: register,

      get cancellationRequested() {
        return requested;
      },

      throwIfRequested: throwIfRequested
    },
    cancel: cancel
  };
};

var getCommandArgument = function getCommandArgument(argv, name) {
  var i = 0;

  while (i < argv.length) {
    var arg = argv[i];

    if (arg === name) {
      return {
        name: name,
        index: i,
        value: ""
      };
    }

    if (arg.startsWith("".concat(name, "="))) {
      return {
        name: name,
        index: i,
        value: arg.slice("".concat(name, "=").length)
      };
    }

    i++;
  }

  return null;
};

function _call(body, then, direct) {
  if (direct) {
    return then ? then(body()) : body();
  }

  try {
    var result = Promise.resolve(body());
    return then ? result.then(then) : result;
  } catch (e) {
    return Promise.reject(e);
  }
}

function _catch(body, recover) {
  try {
    var result = body();
  } catch (e) {
    return recover(e);
  }

  if (result && result.then) {
    return result.then(void 0, recover);
  }

  return result;
}

function _async(f) {
  return function () {
    for (var args = [], i = 0; i < arguments.length; i++) {
      args[i] = arguments[i];
    }

    try {
      return Promise.resolve(f.apply(this, args));
    } catch (e) {
      return Promise.reject(e);
    }
  };
}

var wrapExternalFunction = function wrapExternalFunction(fn) {
  var _ref = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {},
      _ref$catchCancellatio = _ref.catchCancellation,
      catchCancellation = _ref$catchCancellatio === void 0 ? false : _ref$catchCancellatio,
      _ref$unhandledRejecti = _ref.unhandledRejectionStrict,
      unhandledRejectionStrict = _ref$unhandledRejecti === void 0 ? false : _ref$unhandledRejecti;

  if (catchCancellation) {
    var previousFn = fn;
    fn = _async(function () {
      return _catch(previousFn, function (error) {
        if (isCancelError(error)) {
          // it means consume of the function will resolve with a cancelError
          // but when you cancel it means you're not interested in the result anymore
          // thanks to this it avoid unhandledRejection
          return error;
        }

        throw error;
      });
    });
  }

  if (unhandledRejectionStrict) {
    var _previousFn = fn;
    fn = _async(function () {
      var uninstall = installUnhandledRejectionStrict();
      return _catch(function () {
        return _call(_previousFn, function (value) {
          uninstall();
          return value;
        });
      }, function (e) {
        // don't remove it immediatly to let nodejs emit the unhandled rejection
        setTimeout(function () {
          uninstall();
        });
        throw e;
      });
    });
  }

  return fn();
};

var installUnhandledRejectionStrict = function installUnhandledRejectionStrict() {
  var unhandledRejectionArg = getCommandArgument(process.execArgv, "--unhandled-rejections");
  if (unhandledRejectionArg === "strict") return function () {};

  var onUnhandledRejection = function onUnhandledRejection(reason) {
    throw reason;
  };

  process.once("unhandledRejection", onUnhandledRejection);
  return function () {
    process.removeListener("unhandledRejection", onUnhandledRejection);
  };
};

var mkdir = promises.mkdir;

var resolveUrl = function resolveUrl(specifier, baseUrl) {
  if (typeof baseUrl === "undefined") {
    throw new TypeError("baseUrl missing to resolve ".concat(specifier));
  }

  return String(new URL(specifier, baseUrl));
};

var isWindows$1 = process.platform === "win32";
var baseUrlFallback = fileSystemPathToUrl(process.cwd());

var symlink = promises.symlink;

var isWindows$2 = process.platform === "win32";

var addCallback = function addCallback(callback) {
  var triggerHangUpOrDeath = function triggerHangUpOrDeath() {
    return callback();
  }; // SIGHUP http://man7.org/linux/man-pages/man7/signal.7.html


  process.once("SIGUP", triggerHangUpOrDeath);
  return function () {
    process.removeListener("SIGUP", triggerHangUpOrDeath);
  };
};

var SIGUPSignal = {
  addCallback: addCallback
};

var addCallback$1 = function addCallback(callback) {
  // SIGINT is CTRL+C from keyboard also refered as keyboard interruption
  // http://man7.org/linux/man-pages/man7/signal.7.html
  // may also be sent by vscode https://github.com/Microsoft/vscode-node-debug/issues/1#issuecomment-405185642
  process.once("SIGINT", callback);
  return function () {
    process.removeListener("SIGINT", callback);
  };
};

var SIGINTSignal = {
  addCallback: addCallback$1
};

var addCallback$2 = function addCallback(callback) {
  if (process.platform === "win32") {
    console.warn("SIGTERM is not supported on windows");
    return function () {};
  }

  var triggerTermination = function triggerTermination() {
    return callback();
  }; // SIGTERM http://man7.org/linux/man-pages/man7/signal.7.html


  process.once("SIGTERM", triggerTermination);
  return function () {
    process.removeListener("SIGTERM", triggerTermination);
  };
};

var SIGTERMSignal = {
  addCallback: addCallback$2
};

function _await(value, then, direct) {
  if (direct) {
    return then ? then(value) : value;
  }

  if (!value || !value.then) {
    value = Promise.resolve(value);
  }

  return then ? value.then(then) : value;
}

var beforeExitCallbackArray = [];
var uninstall;

var addCallback$3 = function addCallback(callback) {
  if (beforeExitCallbackArray.length === 0) uninstall = install();
  beforeExitCallbackArray = [].concat(_toConsumableArray(beforeExitCallbackArray), [callback]);
  return function () {
    if (beforeExitCallbackArray.length === 0) return;
    beforeExitCallbackArray = beforeExitCallbackArray.filter(function (beforeExitCallback) {
      return beforeExitCallback !== callback;
    });
    if (beforeExitCallbackArray.length === 0) uninstall();
  };
};

var install = function install() {
  var onBeforeExit = function onBeforeExit() {
    return beforeExitCallbackArray.reduce(function (previous, callback) {
      return _await(previous, function () {
        return callback();
      });
    }, Promise.resolve());
  };

  process.once("beforeExit", onBeforeExit);
  return function () {
    process.removeListener("beforeExit", onBeforeExit);
  };
};

var beforeExitSignal = {
  addCallback: addCallback$3
};

var addCallback$4 = function addCallback(callback) {
  var _ref = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {},
      _ref$collectException = _ref.collectExceptions,
      collectExceptions = _ref$collectException === void 0 ? false : _ref$collectException;

  if (!collectExceptions) {
    var _exitCallback = function _exitCallback() {
      callback();
    };

    process.on("exit", _exitCallback);
    return function () {
      process.removeListener("exit", _exitCallback);
    };
  }

  var _trackExceptions = trackExceptions(),
      getExceptions = _trackExceptions.getExceptions,
      stop = _trackExceptions.stop;

  var exitCallback = function exitCallback() {
    process.removeListener("exit", exitCallback);
    stop();
    callback({
      exceptionArray: getExceptions().map(function (_ref2) {
        var exception = _ref2.exception,
            origin = _ref2.origin;
        return {
          exception: exception,
          origin: origin
        };
      })
    });
  };

  process.on("exit", exitCallback);
  return function () {
    process.removeListener("exit", exitCallback);
  };
};

var trackExceptions = function trackExceptions() {
  var exceptionArray = [];

  var unhandledRejectionCallback = function unhandledRejectionCallback(unhandledRejection, promise) {
    exceptionArray = [].concat(_toConsumableArray(exceptionArray), [{
      origin: "unhandledRejection",
      exception: unhandledRejection,
      promise: promise
    }]);
  };

  var rejectionHandledCallback = function rejectionHandledCallback(promise) {
    exceptionArray = exceptionArray.filter(function (exceptionArray) {
      return exceptionArray.promise !== promise;
    });
  };

  var uncaughtExceptionCallback = function uncaughtExceptionCallback(uncaughtException, origin) {
    // since node 12.4 https://nodejs.org/docs/latest-v12.x/api/process.html#process_event_uncaughtexception
    if (origin === "unhandledRejection") return;
    exceptionArray = [].concat(_toConsumableArray(exceptionArray), [{
      origin: "uncaughtException",
      exception: uncaughtException
    }]);
  };

  process.on("unhandledRejection", unhandledRejectionCallback);
  process.on("rejectionHandled", rejectionHandledCallback);
  process.on("uncaughtException", uncaughtExceptionCallback);
  return {
    getExceptions: function getExceptions() {
      return exceptionArray;
    },
    stop: function stop() {
      process.removeListener("unhandledRejection", unhandledRejectionCallback);
      process.removeListener("rejectionHandled", rejectionHandledCallback);
      process.removeListener("uncaughtException", uncaughtExceptionCallback);
    }
  };
};

var exitSignal = {
  addCallback: addCallback$4
};

var addCallback$5 = function addCallback(_callback) {
  return eventRace(_objectSpread({
    SIGHUP: {
      register: SIGUPSignal.addCallback,
      callback: function callback() {
        return _callback("SIGHUP");
      }
    },
    SIGINT: {
      register: SIGINTSignal.addCallback,
      callback: function callback() {
        return _callback("SIGINT");
      }
    }
  }, process.platform === "win32" ? {} : {
    SIGTERM: {
      register: SIGTERMSignal.addCallback,
      callback: function callback() {
        return _callback("SIGTERM");
      }
    }
  }, {
    beforeExit: {
      register: beforeExitSignal.addCallback,
      callback: function callback() {
        return _callback("beforeExit");
      }
    },
    exit: {
      register: exitSignal.addCallback,
      callback: function callback() {
        return _callback("exit");
      }
    }
  }));
};

var eventRace = function eventRace(eventMap) {
  var unregisterMap = {};

  var unregisterAll = function unregisterAll(reason) {
    return Object.keys(unregisterMap).map(function (name) {
      return unregisterMap[name](reason);
    });
  };

  Object.keys(eventMap).forEach(function (name) {
    var _eventMap$name = eventMap[name],
        register = _eventMap$name.register,
        callback = _eventMap$name.callback;
    unregisterMap[name] = register(function () {
      unregisterAll();
      callback.apply(void 0, arguments);
    });
  });
  return unregisterAll;
};

var teardownSignal = {
  addCallback: addCallback$5
};

var createCancellationTokenForProcess = function createCancellationTokenForProcess() {
  var teardownCancelSource = createCancellationSource();
  teardownSignal.addCallback(function (reason) {
    return teardownCancelSource.cancel("process ".concat(reason));
  });
  return teardownCancelSource.token;
};

var stat = promises.stat;

function _await$1(value, then, direct) {
  if (direct) {
    return then ? then(value) : value;
  }

  if (!value || !value.then) {
    value = Promise.resolve(value);
  }

  return then ? value.then(then) : value;
}

var readFilePromisified = promisify(readFile$2);

function _async$1(f) {
  return function () {
    for (var args = [], i = 0; i < arguments.length; i++) {
      args[i] = arguments[i];
    }

    try {
      return Promise.resolve(f.apply(this, args));
    } catch (e) {
      return Promise.reject(e);
    }
  };
}

var readFile = _async$1(function (value) {
  var fileUrl = assertAndNormalizeFileUrl(value);
  var filePath = urlToFileSystemPath(fileUrl);
  return _await$1(readFilePromisified(filePath), function (buffer) {
    return buffer.toString();
  });
});

var isWindows$3 = process.platform === "win32";

var isLinux = process.platform === "linux"; // linux does not support recursive option

var access = promises.access;

var R_OK = constants.R_OK,
    W_OK = constants.W_OK,
    X_OK = constants.X_OK;

var writeFileNode = promises.writeFile;

var exec = function exec(command) {
  var _ref = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {},
      cwd = _ref.cwd,
      _ref$onLog = _ref.onLog,
      onLog = _ref$onLog === void 0 ? function () {} : _ref$onLog,
      _ref$onErrorLog = _ref.onErrorLog,
      onErrorLog = _ref$onErrorLog === void 0 ? function () {} : _ref$onErrorLog;

  return new Promise(function (resolve, reject) {
    var command = exec$1(command, {
      cwd: cwd,
      stdio: "silent"
    }, function (error) {
      if (error) {
        reject(error);
      } else {
        resolve();
      }
    });
    command.stdout.on("data", function (data) {
      onLog(data);
    });
    command.stderr.on("data", function (data) {
      // debug because this output is part of
      // the error message generated by a failing npm publish
      onErrorLog(data);
    });
  });
};

var convertFileSystemErrorToResponseProperties = function convertFileSystemErrorToResponseProperties(error) {
  // https://iojs.org/api/errors.html#errors_eacces_permission_denied
  if (isErrorWithCode(error, "EACCES")) {
    return {
      status: 403,
      statusText: "no permission to read file"
    };
  }

  if (isErrorWithCode(error, "EPERM")) {
    return {
      status: 403,
      statusText: "no permission to read file"
    };
  }

  if (isErrorWithCode(error, "ENOENT")) {
    return {
      status: 404,
      statusText: "file not found"
    };
  } // file access may be temporarily blocked
  // (by an antivirus scanning it because recently modified for instance)


  if (isErrorWithCode(error, "EBUSY")) {
    return {
      status: 503,
      statusText: "file is busy",
      headers: {
        "retry-after": 0.01 // retry in 10ms

      }
    };
  } // emfile means there is too many files currently opened


  if (isErrorWithCode(error, "EMFILE")) {
    return {
      status: 503,
      statusText: "too many file opened",
      headers: {
        "retry-after": 0.1 // retry in 100ms

      }
    };
  }

  if (isErrorWithCode(error, "EISDIR")) {
    return {
      status: 500,
      statusText: "Unexpected directory operation"
    };
  }

  return Promise.reject(error);
};

var isErrorWithCode = function isErrorWithCode(error, code) {
  return _typeof(error) === "object" && error.code === code;
};

if ("observable" in Symbol === false) {
  Symbol.observable = Symbol.for("observable");
}

var ensureUrlTrailingSlash$1 = function ensureUrlTrailingSlash(url) {
  return url.endsWith("/") ? url : "".concat(url, "/");
};

var isFileSystemPath$1 = function isFileSystemPath(value) {
  if (typeof value !== "string") {
    throw new TypeError("isFileSystemPath first arg must be a string, got ".concat(value));
  }

  if (value[0] === "/") return true;
  return startsWithWindowsDriveLetter$1(value);
};

var startsWithWindowsDriveLetter$1 = function startsWithWindowsDriveLetter(string) {
  var firstChar = string[0];
  if (!/[a-zA-Z]/.test(firstChar)) return false;
  var secondChar = string[1];
  if (secondChar !== ":") return false;
  return true;
};

var fileSystemPathToUrl$1 = function fileSystemPathToUrl(value) {
  if (!isFileSystemPath$1(value)) {
    throw new Error("received an invalid value for fileSystemPath: ".concat(value));
  }

  return String(pathToFileURL(value));
};

var assertAndNormalizeDirectoryUrl$1 = function assertAndNormalizeDirectoryUrl(value) {
  var urlString;

  if (value instanceof URL) {
    urlString = value.href;
  } else if (typeof value === "string") {
    if (isFileSystemPath$1(value)) {
      urlString = fileSystemPathToUrl$1(value);
    } else {
      try {
        urlString = String(new URL(value));
      } catch (e) {
        throw new TypeError("directoryUrl must be a valid url, received ".concat(value));
      }
    }
  } else {
    throw new TypeError("directoryUrl must be a string or an url, received ".concat(value));
  }

  if (!urlString.startsWith("file://")) {
    throw new Error("directoryUrl must starts with file://, received ".concat(value));
  }

  return ensureUrlTrailingSlash$1(urlString);
};

var assertAndNormalizeFileUrl$1 = function assertAndNormalizeFileUrl(value, baseUrl) {
  var urlString;

  if (value instanceof URL) {
    urlString = value.href;
  } else if (typeof value === "string") {
    if (isFileSystemPath$1(value)) {
      urlString = fileSystemPathToUrl$1(value);
    } else {
      try {
        urlString = String(new URL(value, baseUrl));
      } catch (e) {
        throw new TypeError("fileUrl must be a valid url, received ".concat(value));
      }
    }
  } else {
    throw new TypeError("fileUrl must be a string or an url, received ".concat(value));
  }

  if (!urlString.startsWith("file://")) {
    throw new Error("fileUrl must starts with file://, received ".concat(value));
  }

  return urlString;
};

var urlToFileSystemPath$1 = function urlToFileSystemPath(fileUrl) {
  if (fileUrl[fileUrl.length - 1] === "/") {
    // remove trailing / so that nodejs path becomes predictable otherwise it logs
    // the trailing slash on linux but does not on windows
    fileUrl = fileUrl.slice(0, -1);
  }

  var fileSystemPath = fileURLToPath(fileUrl);
  return fileSystemPath;
};

// https://github.com/coderaiser/cloudcmd/issues/63#issuecomment-195478143
// https://nodejs.org/api/fs.html#fs_file_modes
// https://github.com/TooTallNate/stat-mode
// cannot get from fs.constants because they are not available on windows
var S_IRUSR = 256;
/* 0000400 read permission, owner */

var S_IWUSR = 128;
/* 0000200 write permission, owner */

var S_IXUSR = 64;
/* 0000100 execute/search permission, owner */

var S_IRGRP = 32;
/* 0000040 read permission, group */

var S_IWGRP = 16;
/* 0000020 write permission, group */

var S_IXGRP = 8;
/* 0000010 execute/search permission, group */

var S_IROTH = 4;
/* 0000004 read permission, others */

var S_IWOTH = 2;
/* 0000002 write permission, others */

var S_IXOTH = 1;
var permissionsToBinaryFlags = function permissionsToBinaryFlags(_ref) {
  var owner = _ref.owner,
      group = _ref.group,
      others = _ref.others;
  var binaryFlags = 0;
  if (owner.read) binaryFlags |= S_IRUSR;
  if (owner.write) binaryFlags |= S_IWUSR;
  if (owner.execute) binaryFlags |= S_IXUSR;
  if (group.read) binaryFlags |= S_IRGRP;
  if (group.write) binaryFlags |= S_IWGRP;
  if (group.execute) binaryFlags |= S_IXGRP;
  if (others.read) binaryFlags |= S_IROTH;
  if (others.write) binaryFlags |= S_IWOTH;
  if (others.execute) binaryFlags |= S_IXOTH;
  return binaryFlags;
};

function _async$2(f) {
  return function () {
    for (var args = [], i = 0; i < arguments.length; i++) {
      args[i] = arguments[i];
    }

    try {
      return Promise.resolve(f.apply(this, args));
    } catch (e) {
      return Promise.reject(e);
    }
  };
}

var writeFileSystemNodePermissions = _async$2(function (source, permissions) {
  var sourceUrl = assertAndNormalizeFileUrl$1(source);
  var sourcePath = urlToFileSystemPath$1(sourceUrl);
  var binaryFlags;

  if (_typeof(permissions) === "object") {
    permissions = {
      owner: {
        read: getPermissionOrComputeDefault("read", "owner", permissions),
        write: getPermissionOrComputeDefault("write", "owner", permissions),
        execute: getPermissionOrComputeDefault("execute", "owner", permissions)
      },
      group: {
        read: getPermissionOrComputeDefault("read", "group", permissions),
        write: getPermissionOrComputeDefault("write", "group", permissions),
        execute: getPermissionOrComputeDefault("execute", "group", permissions)
      },
      others: {
        read: getPermissionOrComputeDefault("read", "others", permissions),
        write: getPermissionOrComputeDefault("write", "others", permissions),
        execute: getPermissionOrComputeDefault("execute", "others", permissions)
      }
    };
    binaryFlags = permissionsToBinaryFlags(permissions);
  } else {
    binaryFlags = permissions;
  }

  return chmodNaive(sourcePath, binaryFlags);
});

var chmodNaive = function chmodNaive(fileSystemPath, binaryFlags) {
  return new Promise(function (resolve, reject) {
    chmod(fileSystemPath, binaryFlags, function (error) {
      if (error) {
        reject(error);
      } else {
        resolve();
      }
    });
  });
};

var actionLevels = {
  read: 0,
  write: 1,
  execute: 2
};
var subjectLevels = {
  others: 0,
  group: 1,
  owner: 2
};

var getPermissionOrComputeDefault = function getPermissionOrComputeDefault(action, subject, permissions) {
  if (subject in permissions) {
    var subjectPermissions = permissions[subject];

    if (action in subjectPermissions) {
      return subjectPermissions[action];
    }

    var actionLevel = actionLevels[action];
    var actionFallback = Object.keys(actionLevels).find(function (actionFallbackCandidate) {
      return actionLevels[actionFallbackCandidate] > actionLevel && actionFallbackCandidate in subjectPermissions;
    });

    if (actionFallback) {
      return subjectPermissions[actionFallback];
    }
  }

  var subjectLevel = subjectLevels[subject]; // do we have a subject with a stronger level (group or owner)
  // where we could read the action permission ?

  var subjectFallback = Object.keys(subjectLevels).find(function (subjectFallbackCandidate) {
    return subjectLevels[subjectFallbackCandidate] > subjectLevel && subjectFallbackCandidate in permissions;
  });

  if (subjectFallback) {
    var _subjectPermissions = permissions[subjectFallback];
    return action in _subjectPermissions ? _subjectPermissions[action] : getPermissionOrComputeDefault(action, subjectFallback, permissions);
  }

  return false;
};

function _async$3(f) {
  return function () {
    for (var args = [], i = 0; i < arguments.length; i++) {
      args[i] = arguments[i];
    }

    try {
      return Promise.resolve(f.apply(this, args));
    } catch (e) {
      return Promise.reject(e);
    }
  };
}

var isWindows$4 = process.platform === "win32";

function _await$2(value, then, direct) {
  if (direct) {
    return then ? then(value) : value;
  }

  if (!value || !value.then) {
    value = Promise.resolve(value);
  }

  return then ? value.then(then) : value;
}

function _catch$1(body, recover) {
  try {
    var result = body();
  } catch (e) {
    return recover(e);
  }

  if (result && result.then) {
    return result.then(void 0, recover);
  }

  return result;
}

var readFileSystemNodeStat = _async$3(function (source) {
  var _ref = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {},
      _ref$nullIfNotFound = _ref.nullIfNotFound,
      nullIfNotFound = _ref$nullIfNotFound === void 0 ? false : _ref$nullIfNotFound,
      _ref$followLink = _ref.followLink,
      followLink = _ref$followLink === void 0 ? true : _ref$followLink;

  if (source.endsWith("/")) source = source.slice(0, -1);
  var sourceUrl = assertAndNormalizeFileUrl$1(source);
  var sourcePath = urlToFileSystemPath$1(sourceUrl);
  var handleNotFoundOption = nullIfNotFound ? {
    handleNotFoundError: function handleNotFoundError() {
      return null;
    }
  } : {};
  return readStat(sourcePath, _objectSpread({
    followLink: followLink
  }, handleNotFoundOption, {}, isWindows$4 ? {
    // Windows can EPERM on stat
    handlePermissionDeniedError: _async$3(function (error) {
      // unfortunately it means we mutate the permissions
      // without being able to restore them to the previous value
      // (because reading current permission would also throw)
      return _catch$1(function () {
        return _await$2(writeFileSystemNodePermissions(sourceUrl, 438), function () {
          return _await$2(readStat(sourcePath, _objectSpread({
            followLink: followLink
          }, handleNotFoundOption, {
            // could not fix the permission error, give up and throw original error
            handlePermissionDeniedError: function handlePermissionDeniedError() {
              throw error;
            }
          })));
        });
      }, function () {
        // failed to write permission or readState, throw original error as well
        throw error;
      });
    })
  } : {}));
});

var readStat = function readStat(sourcePath) {
  var _ref2 = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {},
      followLink = _ref2.followLink,
      _ref2$handleNotFoundE = _ref2.handleNotFoundError,
      handleNotFoundError = _ref2$handleNotFoundE === void 0 ? null : _ref2$handleNotFoundE,
      _ref2$handlePermissio = _ref2.handlePermissionDeniedError,
      handlePermissionDeniedError = _ref2$handlePermissio === void 0 ? null : _ref2$handlePermissio;

  var nodeMethod = followLink ? stat$2 : lstat;
  return new Promise(function (resolve, reject) {
    nodeMethod(sourcePath, function (error, statsObject) {
      if (error) {
        if (handlePermissionDeniedError && (error.code === "EPERM" || error.code === "EACCES")) {
          resolve(handlePermissionDeniedError(error));
        } else if (handleNotFoundError && error.code === "ENOENT") {
          resolve(handleNotFoundError(error));
        } else {
          reject(error);
        }
      } else {
        resolve(statsObject);
      }
    });
  });
};

var ETAG_FOR_EMPTY_CONTENT = '"0-2jmj7l5rSw0yVb/vlWAYkK/YBwk"';
var bufferToEtag = function bufferToEtag(buffer) {
  if (!Buffer.isBuffer(buffer)) {
    throw new TypeError("buffer expected, got ".concat(buffer));
  }

  if (buffer.length === 0) {
    return ETAG_FOR_EMPTY_CONTENT;
  }

  var hash = createHash("sha1");
  hash.update(buffer, "utf8");
  var hashBase64String = hash.digest("base64");
  var hashBase64StringSubset = hashBase64String.slice(0, 27);
  var length = buffer.length;
  return "\"".concat(length.toString(16), "-").concat(hashBase64StringSubset, "\"");
};

function _async$4(f) {
  return function () {
    for (var args = [], i = 0; i < arguments.length; i++) {
      args[i] = arguments[i];
    }

    try {
      return Promise.resolve(f.apply(this, args));
    } catch (e) {
      return Promise.reject(e);
    }
  };
}

var readDirectory = _async$4(function (url) {
  var _ref = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {},
      _ref$emfileMaxWait = _ref.emfileMaxWait,
      emfileMaxWait = _ref$emfileMaxWait === void 0 ? 1000 : _ref$emfileMaxWait;

  var directoryUrl = assertAndNormalizeDirectoryUrl$1(url);
  var directoryPath = urlToFileSystemPath$1(directoryUrl);
  var startMs = Date.now();
  var attemptCount = 0;

  var attempt = function attempt() {
    return readdirNaive(directoryPath, {
      handleTooManyFilesOpenedError: _async$4(function (error) {
        attemptCount++;
        var nowMs = Date.now();
        var timeSpentWaiting = nowMs - startMs;

        if (timeSpentWaiting > emfileMaxWait) {
          throw error;
        }

        return new Promise(function (resolve) {
          setTimeout(function () {
            resolve(attempt());
          }, attemptCount);
        });
      })
    });
  };

  return attempt();
});

var readdirNaive = function readdirNaive(directoryPath) {
  var _ref2 = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {},
      _ref2$handleTooManyFi = _ref2.handleTooManyFilesOpenedError,
      handleTooManyFilesOpenedError = _ref2$handleTooManyFi === void 0 ? null : _ref2$handleTooManyFi;

  return new Promise(function (resolve, reject) {
    readdir(directoryPath, function (error, names) {
      if (error) {
        // https://nodejs.org/dist/latest-v13.x/docs/api/errors.html#errors_common_system_errors
        if (handleTooManyFilesOpenedError && (error.code === "EMFILE" || error.code === "ENFILE")) {
          resolve(handleTooManyFilesOpenedError(error));
        } else {
          reject(error);
        }
      } else {
        resolve(names);
      }
    });
  });
};

var mkdir$1 = promises.mkdir;

var isWindows$5 = process.platform === "win32";
var baseUrlFallback$1 = fileSystemPathToUrl$1(process.cwd());

var symlink$1 = promises.symlink;

var isWindows$6 = process.platform === "win32";

var stat$1 = promises.stat;

var readFilePromisified$1 = promisify(readFile$2);

var isWindows$7 = process.platform === "win32";

var isLinux$1 = process.platform === "linux"; // linux does not support recursive option

var access$1 = promises.access;

var R_OK$1 = constants.R_OK,
    W_OK$1 = constants.W_OK,
    X_OK$1 = constants.X_OK;

var writeFileNode$1 = promises.writeFile;

var jsenvContentTypeMap = {
  "application/javascript": {
    extensions: ["js", "cjs", "mjs", "ts", "jsx"]
  },
  "application/json": {
    extensions: ["json"]
  },
  "application/octet-stream": {},
  "application/pdf": {
    extensions: ["pdf"]
  },
  "application/xml": {
    extensions: ["xml"]
  },
  "application/x-gzip": {
    extensions: ["gz"]
  },
  "application/wasm": {
    extensions: ["wasm"]
  },
  "application/zip": {
    extensions: ["zip"]
  },
  "audio/basic": {
    extensions: ["au", "snd"]
  },
  "audio/mpeg": {
    extensions: ["mpga", "mp2", "mp2a", "mp3", "m2a", "m3a"]
  },
  "audio/midi": {
    extensions: ["midi", "mid", "kar", "rmi"]
  },
  "audio/mp4": {
    extensions: ["m4a", "mp4a"]
  },
  "audio/ogg": {
    extensions: ["oga", "ogg", "spx"]
  },
  "audio/webm": {
    extensions: ["weba"]
  },
  "audio/x-wav": {
    extensions: ["wav"]
  },
  "font/ttf": {
    extensions: ["ttf"]
  },
  "font/woff": {
    extensions: ["woff"]
  },
  "font/woff2": {
    extensions: ["woff2"]
  },
  "image/png": {
    extensions: ["png"]
  },
  "image/gif": {
    extensions: ["gif"]
  },
  "image/jpeg": {
    extensions: ["jpg"]
  },
  "image/svg+xml": {
    extensions: ["svg", "svgz"]
  },
  "text/plain": {
    extensions: ["txt"]
  },
  "text/html": {
    extensions: ["html"]
  },
  "text/css": {
    extensions: ["css"]
  },
  "text/cache-manifest": {
    extensions: ["appcache"]
  },
  "video/mp4": {
    extensions: ["mp4", "mp4v", "mpg4"]
  },
  "video/mpeg": {
    extensions: ["mpeg", "mpg", "mpe", "m1v", "m2v"]
  },
  "video/ogg": {
    extensions: ["ogv"]
  },
  "video/webm": {
    extensions: ["webm"]
  }
};

var urlToContentType = function urlToContentType(url) {
  var contentTypeMap = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : jsenvContentTypeMap;
  var contentTypeDefault = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : "application/octet-stream";

  if (_typeof(contentTypeMap) !== "object") {
    throw new TypeError("contentTypeMap must be an object, got ".concat(contentTypeMap));
  }

  var pathname = new URL(url).pathname;
  var extensionWithDot = extname(pathname);

  if (!extensionWithDot || extensionWithDot === ".") {
    return contentTypeDefault;
  }

  var extension = extensionWithDot.slice(1);
  var availableContentTypes = Object.keys(contentTypeMap);
  var contentTypeForExtension = availableContentTypes.find(function (contentTypeName) {
    var contentType = contentTypeMap[contentTypeName];
    return contentType.extensions && contentType.extensions.indexOf(extension) > -1;
  });
  return contentTypeForExtension || contentTypeDefault;
};

function _await$3(value, then, direct) {
  if (direct) {
    return then ? then(value) : value;
  }

  if (!value || !value.then) {
    value = Promise.resolve(value);
  }

  return then ? value.then(then) : value;
}

var readFile$1 = promises.readFile;

function _invoke(body, then) {
  var result = body();

  if (result && result.then) {
    return result.then(then);
  }

  return then(result);
} // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/toUTCString


function _catch$2(body, recover) {
  try {
    var result = body();
  } catch (e) {
    return recover(e);
  }

  if (result && result.then) {
    return result.then(void 0, recover);
  }

  return result;
}

function _async$5(f) {
  return function () {
    for (var args = [], i = 0; i < arguments.length; i++) {
      args[i] = arguments[i];
    }

    try {
      return Promise.resolve(f.apply(this, args));
    } catch (e) {
      return Promise.reject(e);
    }
  };
}

var serveFile = _async$5(function (source) {
  var _ref = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {},
      _ref$cancellationToke = _ref.cancellationToken,
      cancellationToken = _ref$cancellationToke === void 0 ? createCancellationToken() : _ref$cancellationToke,
      _ref$method = _ref.method,
      method = _ref$method === void 0 ? "GET" : _ref$method,
      _ref$headers = _ref.headers,
      headers = _ref$headers === void 0 ? {} : _ref$headers,
      _ref$canReadDirectory = _ref.canReadDirectory,
      canReadDirectory = _ref$canReadDirectory === void 0 ? false : _ref$canReadDirectory,
      _ref$cacheStrategy = _ref.cacheStrategy,
      cacheStrategy = _ref$cacheStrategy === void 0 ? "etag" : _ref$cacheStrategy,
      _ref$contentTypeMap = _ref.contentTypeMap,
      contentTypeMap = _ref$contentTypeMap === void 0 ? jsenvContentTypeMap : _ref$contentTypeMap;

  if (method !== "GET" && method !== "HEAD") {
    return {
      status: 501
    };
  }

  var sourceUrl = assertAndNormalizeFileUrl$1(source);
  var clientCacheDisabled = headers["cache-control"] === "no-cache";
  return _catch$2(function () {
    var cacheWithMtime = !clientCacheDisabled && cacheStrategy === "mtime";
    var cacheWithETag = !clientCacheDisabled && cacheStrategy === "etag";
    var cachedDisabled = clientCacheDisabled || cacheStrategy === "none";
    return _await$3(createOperation({
      cancellationToken: cancellationToken,
      start: function start() {
        return readFileSystemNodeStat(sourceUrl);
      }
    }), function (sourceStat) {
      var _exit = false;
      return _invoke(function () {
        if (sourceStat.isDirectory()) {
          if (canReadDirectory === false) {
            _exit = true;
            return {
              status: 403,
              statusText: "not allowed to read directory",
              headers: _objectSpread({}, cachedDisabled ? {
                "cache-control": "no-store"
              } : {})
            };
          }

          return _await$3(createOperation({
            cancellationToken: cancellationToken,
            start: function start() {
              return readDirectory(sourceUrl);
            }
          }), function (directoryContentArray) {
            var directoryContentJson = JSON.stringify(directoryContentArray);
            _exit = true;
            return {
              status: 200,
              headers: _objectSpread({}, cachedDisabled ? {
                "cache-control": "no-store"
              } : {}, {
                "content-type": "application/json",
                "content-length": directoryContentJson.length
              }),
              body: directoryContentJson
            };
          });
        }
      }, function (_result) {
        var _exit2 = false;
        if (_exit) return _result;
        return sourceStat.isFile() ? _invoke(function () {
          if (cacheWithETag) {
            return _await$3(createOperation({
              cancellationToken: cancellationToken,
              start: function start() {
                return readFile$1(urlToFileSystemPath$1(sourceUrl));
              }
            }), function (fileContentAsBuffer) {
              var fileContentEtag = bufferToEtag(fileContentAsBuffer);

              if ("if-none-match" in headers && headers["if-none-match"] === fileContentEtag) {
                _exit2 = true;
                return {
                  status: 304,
                  headers: _objectSpread({}, cachedDisabled ? {
                    "cache-control": "no-store"
                  } : {})
                };
              }

              _exit2 = true;
              return {
                status: 200,
                headers: _objectSpread({}, cachedDisabled ? {
                  "cache-control": "no-store"
                } : {}, {
                  "content-length": sourceStat.size,
                  "content-type": urlToContentType(sourceUrl, contentTypeMap),
                  "etag": fileContentEtag
                }),
                body: fileContentAsBuffer
              };
            });
          }
        }, function (_result2) {
          if (_exit2) return _result2;

          if (cacheWithMtime && "if-modified-since" in headers) {
            var cachedModificationDate;

            try {
              cachedModificationDate = new Date(headers["if-modified-since"]);
            } catch (e) {
              return {
                status: 400,
                statusText: "if-modified-since header is not a valid date"
              };
            }

            var actualModificationDate = dateToSecondsPrecision(sourceStat.mtime);

            if (Number(cachedModificationDate) >= Number(actualModificationDate)) {
              return {
                status: 304
              };
            }
          }

          return {
            status: 200,
            headers: _objectSpread({}, cachedDisabled ? {
              "cache-control": "no-store"
            } : {}, {}, cacheWithMtime ? {
              "last-modified": dateToUTCString(sourceStat.mtime)
            } : {}, {
              "content-length": sourceStat.size,
              "content-type": urlToContentType(sourceUrl, contentTypeMap)
            }),
            body: createReadStream(urlToFileSystemPath$1(sourceUrl))
          };
        }) : {
          status: 404,
          headers: _objectSpread({}, cachedDisabled ? {
            "cache-control": "no-store"
          } : {})
        };
      }); // not a file, give up
    });
  }, function (e) {
    return convertFileSystemErrorToResponseProperties(e);
  });
});

var dateToUTCString = function dateToUTCString(date) {
  return date.toUTCString();
};

var dateToSecondsPrecision = function dateToSecondsPrecision(date) {
  var dateWithSecondsPrecision = new Date(date);
  dateWithSecondsPrecision.setMilliseconds(0);
  return dateWithSecondsPrecision;
};

function _await$4(value, then, direct) {
  if (direct) {
    return then ? then(value) : value;
  }

  if (!value || !value.then) {
    value = Promise.resolve(value);
  }

  return then ? value.then(then) : value;
}

var require = createRequire(import.meta.url);

function _catch$3(body, recover) {
  try {
    var result = body();
  } catch (e) {
    return recover(e);
  }

  if (result && result.then) {
    return result.then(void 0, recover);
  }

  return result;
}

var nodeFetch = require("node-fetch");

function _continue(value, then) {
  return value && value.then ? value.then(then) : then(value);
}

var AbortController = require("abort-controller");

function _invoke$1(body, then) {
  var result = body();

  if (result && result.then) {
    return result.then(then);
  }

  return then(result);
}

var Response = nodeFetch.Response;

function _async$6(f) {
  return function () {
    for (var args = [], i = 0; i < arguments.length; i++) {
      args[i] = arguments[i];
    }

    try {
      return Promise.resolve(f.apply(this, args));
    } catch (e) {
      return Promise.reject(e);
    }
  };
}

var fetchUrl = _async$6(function (url) {
  var _exit = false;

  var _ref = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

  var _ref$cancellationToke = _ref.cancellationToken,
      cancellationToken = _ref$cancellationToke === void 0 ? createCancellationToken() : _ref$cancellationToke,
      _ref$simplified = _ref.simplified,
      simplified = _ref$simplified === void 0 ? false : _ref$simplified,
      _ref$ignoreHttpsError = _ref.ignoreHttpsError,
      ignoreHttpsError = _ref$ignoreHttpsError === void 0 ? false : _ref$ignoreHttpsError,
      canReadDirectory = _ref.canReadDirectory,
      contentTypeMap = _ref.contentTypeMap,
      cacheStrategy = _ref.cacheStrategy,
      options = _objectWithoutProperties(_ref, ["cancellationToken", "simplified", "ignoreHttpsError", "canReadDirectory", "contentTypeMap", "cacheStrategy"]);

  try {
    url = String(new URL(url));
  } catch (e) {
    throw new Error("fetchUrl first argument must be an absolute url, received ".concat(url));
  }

  return _invoke$1(function () {
    if (url.startsWith("file://")) {
      return _await$4(serveFile(url, _objectSpread({
        cancellationToken: cancellationToken,
        cacheStrategy: cacheStrategy,
        canReadDirectory: canReadDirectory,
        contentTypeMap: contentTypeMap
      }, options)), function (_ref2) {
        var status = _ref2.status,
            statusText = _ref2.statusText,
            headers = _ref2.headers,
            body = _ref2.body;
        var response = new Response(typeof body === "string" ? Buffer.from(body) : body, {
          url: url,
          status: status,
          statusText: statusText,
          headers: headers
        });
        _exit = true;
        return simplified ? standardResponseToSimplifiedResponse(response) : response;
      });
    }
  }, function (_result) {
    if (_exit) return _result;
    // cancellation might be requested early, abortController does not support that
    // so we have to throw if requested right away
    cancellationToken.throwIfRequested(); // https://github.com/bitinn/node-fetch#request-cancellation-with-abortsignal

    var abortController = new AbortController();
    var cancelError;
    cancellationToken.register(function (reason) {
      cancelError = reason;
      abortController.abort(reason);
    });
    var response;
    return _continue(_catch$3(function () {
      return _await$4(nodeFetch(url, _objectSpread({
        signal: abortController.signal
      }, ignoreHttpsError && url.startsWith("https") ? {
        agent: new Agent({
          rejectUnauthorized: false
        })
      } : {}, {}, options)), function (_nodeFetch) {
        response = _nodeFetch;
      });
    }, function (e) {
      if (cancelError && e.name === "AbortError") {
        throw cancelError;
      }

      throw e;
    }), function (_result2) {
      return  simplified ? standardResponseToSimplifiedResponse(response) : response;
    });
  });
});

var standardResponseToSimplifiedResponse = _async$6(function (response) {
  return _await$4(response.text(), function (text) {
    return {
      url: response.url,
      status: response.status,
      statusText: response.statusText,
      headers: responseToHeaders(response),
      body: text
    };
  });
});

var responseToHeaders = function responseToHeaders(response) {
  var headers = {};
  response.headers.forEach(function (value, name) {
    headers[name] = value;
  });
  return headers;
};

var require$1 = createRequire(import.meta.url);

var killPort = require$1("kill-port");

function _async$7(f) {
  return function () {
    for (var args = [], i = 0; i < arguments.length; i++) {
      args[i] = arguments[i];
    }

    try {
      return Promise.resolve(f.apply(this, args));
    } catch (e) {
      return Promise.reject(e);
    }
  };
}

function _await$5(value, then, direct) {
  if (direct) {
    return then ? then(value) : value;
  }

  if (!value || !value.then) {
    value = Promise.resolve(value);
  }

  return then ? value.then(then) : value;
}

function _catch$4(body, recover) {
  try {
    var result = body();
  } catch (e) {
    return recover(e);
  }

  if (result && result.then) {
    return result.then(void 0, recover);
  }

  return result;
}

function _continue$1(value, then) {
  return value && value.then ? value.then(then) : then(value);
}

var getGithubRessource = _async$7(function (url) {
  var _ref = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {},
      githubToken = _ref.githubToken,
      cancellationToken = _ref.cancellationToken;

  return sendHttpRequest(url, {
    cancellationToken: cancellationToken,
    method: "GET",
    headers: {
      authorization: "token ".concat(githubToken)
    },
    responseStatusMap: {
      200: _async$7(function (response) {
        return response.json();
      }),
      404: function _() {
        return null;
      }
    }
  });
});
var postGithubRessource = function postGithubRessource(url, body) {
  var _ref2 = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {},
      cancellationToken = _ref2.cancellationToken,
      githubToken = _ref2.githubToken;

  var bodyAsString = JSON.stringify(body);
  return sendHttpRequest(url, {
    cancellationToken: cancellationToken,
    method: "POST",
    headers: {
      "authorization": "token ".concat(githubToken),
      "content-length": Buffer.byteLength(bodyAsString)
    },
    body: bodyAsString,
    responseStatusMap: {
      201: _async$7(function (response) {
        return response.json();
      })
    }
  });
};
var patchGithubRessource = _async$7(function (url, body) {
  var _ref3 = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {},
      cancellationToken = _ref3.cancellationToken,
      githubToken = _ref3.githubToken;

  var bodyAsString = JSON.stringify(body);
  return sendHttpRequest(url, {
    cancellationToken: cancellationToken,
    method: "PATCH",
    headers: {
      "authorization": "token ".concat(githubToken),
      "content-length": Buffer.byteLength(bodyAsString)
    },
    body: bodyAsString,
    responseStatusMap: {
      200: _async$7(function (response) {
        return response.json();
      })
    }
  });
});

var sendHttpRequest = _async$7(function (url, _ref4) {
  var cancellationToken = _ref4.cancellationToken,
      method = _ref4.method,
      headers = _ref4.headers,
      body = _ref4.body,
      responseStatusMap = _ref4.responseStatusMap;
  var response;
  return _continue$1(_catch$4(function () {
    return _await$5(fetchUrl(url, {
      cancellationToken: cancellationToken,
      method: method,
      headers: headers,
      body: body
    }), function (_fetchUrl) {
      response = _fetchUrl;
    });
  }, function (error) {
    throw new Error("network error during request.\n--- request method ---\n".concat(method, "\n--- request url ---\n").concat(url, "\n--- error stack ---\n").concat(error.stack));
  }), function (_result) {
    var _response = response,
        status = _response.status;
    return status in responseStatusMap ? responseStatusMap[response.status](response) : _await$5(response.json(), function (responseBodyAsJson) {
      var error = new Error("unexpected response status.\n--- expected response status ---\n".concat(Object.keys(responseStatusMap).join(", "), "\n--- response status ---\n").concat(response.status, "\n--- request method ---\n").concat(method, "\n--- request url ---\n").concat(url, "\n--- response json ---\n").concat((JSON.stringify(responseBodyAsJson), "  ")));
      error.responseStatus = status;
      throw error;
    });
  });
});

var getGist = function getGist(gistId, options) {
  return getGithubRessource("https://api.github.com/gists/".concat(gistId), options);
}; // https://developer.github.com/v3/gists/#create-a-gist
// if status is 404 make sure your token got the rights
// to create gists

var postGist = function postGist(_ref, options) {
  var _ref$files = _ref.files,
      files = _ref$files === void 0 ? {} : _ref$files,
      description = _ref.description,
      _ref$secret = _ref.secret,
      secret = _ref$secret === void 0 ? false : _ref$secret;
  return postGithubRessource("https://api.github.com/gists", {
    files: files,
    description: description,
    public: !secret
  }, options);
};
var patchGist = function patchGist(gistId, gist, options) {
  return patchGithubRessource("https://api.github.com/gists/".concat(gistId), gist, options);
};

function _await$6(value, then, direct) {
  if (direct) {
    return then ? then(value) : value;
  }

  if (!value || !value.then) {
    value = Promise.resolve(value);
  }

  return then ? value.then(then) : value;
}

function _async$8(f) {
  return function () {
    for (var args = [], i = 0; i < arguments.length; i++) {
      args[i] = arguments[i];
    }

    try {
      return Promise.resolve(f.apply(this, args));
    } catch (e) {
      return Promise.reject(e);
    }
  };
}

var getPullRequest = function getPullRequest(_ref, options) {
  var repositoryOwner = _ref.repositoryOwner,
      repositoryName = _ref.repositoryName,
      pullRequestNumber = _ref.pullRequestNumber;
  return getGithubRessource("https://api.github.com/repos/".concat(repositoryOwner, "/").concat(repositoryName, "/pulls/").concat(pullRequestNumber), options);
};
var getPullRequestCommentMatching = _async$8(function (predicate, _ref2, options) {
  var repositoryOwner = _ref2.repositoryOwner,
      repositoryName = _ref2.repositoryName,
      pullRequestNumber = _ref2.pullRequestNumber;
  return _await$6(getGithubRessource("https://api.github.com/repos/".concat(repositoryOwner, "/").concat(repositoryName, "/issues/").concat(pullRequestNumber, "/comments"), options), function (comments) {
    return comments.find(predicate);
  });
});
var postPullRequestComment = function postPullRequestComment(commentBody, _ref3, options) {
  var repositoryOwner = _ref3.repositoryOwner,
      repositoryName = _ref3.repositoryName,
      pullRequestNumber = _ref3.pullRequestNumber;
  return postGithubRessource("https://api.github.com/repos/".concat(repositoryOwner, "/").concat(repositoryName, "/issues/").concat(pullRequestNumber, "/comments"), {
    body: commentBody
  }, options);
};
var patchPullRequestComment = function patchPullRequestComment(commentId, commentBody, _ref4, options) {
  var repositoryOwner = _ref4.repositoryOwner,
      repositoryName = _ref4.repositoryName,
      pullRequestNumber = _ref4.pullRequestNumber;
  return patchGithubRessource("https://api.github.com/repos/".concat(repositoryOwner, "/").concat(repositoryName, "/issues/").concat(pullRequestNumber, "/comments"), {
    body: commentBody
  }, options);
};

var enDecimalFormatter = new Intl.NumberFormat("en", {
  style: "decimal"
});
var formatNumericDiff = function formatNumericDiff(valueAsNumber) {
  var valueAsAbsoluteNumber = Math.abs(valueAsNumber);
  var valueAsString = enDecimalFormatter.format(valueAsAbsoluteNumber);

  if (valueAsNumber < 0) {
    return "-".concat(valueAsString);
  }

  if (valueAsNumber > 0) {
    return "+".concat(valueAsString);
  }

  return valueAsString;
};

/*

*/
var generateCommentBody = function generateCommentBody(_ref) {
  var _ref$headerMessages = _ref.headerMessages,
      headerMessages = _ref$headerMessages === void 0 ? [] : _ref$headerMessages,
      baseReport = _ref.baseReport,
      headReport = _ref.headReport,
      baseGist = _ref.baseGist,
      headGist = _ref.headGist,
      pullRequestBase = _ref.pullRequestBase,
      pullRequestHead = _ref.pullRequestHead;
  var baseVersion = baseReport.lighthouseVersion;
  var headVersion = headReport.lighthouseVersion;
  var impactAnalysisEnabled = true;

  if (baseVersion !== headVersion) {
    impactAnalysisEnabled = false;
    headerMessages.push("**Warning:** Impact analysis skipped because lighthouse version are different on `".concat(pullRequestBase, "` (").concat(baseVersion, ") and `").concat(pullRequestHead, "` (").concat(headVersion, ")."));
  }

  return "<!-- Generated by @jsenv/github-pull-request-lighthouse-impact -->\n".concat(baseGist ? "<!-- base-gist-id=".concat(baseGist.id, " -->") : "", "\n").concat(headGist ? "<!-- head-gist-id=".concat(headGist.id, " -->") : "", "\n<h2>Lighthouse merge impact</h2>\n\n").concat(renderHeader(headerMessages), "\n").concat(impactAnalysisEnabled ? renderBody({
    baseReport: baseReport,
    headReport: headReport,
    pullRequestBase: pullRequestBase,
    pullRequestHead: pullRequestHead
  }) : "", "\n").concat(renderFooter({
    baseGist: baseGist,
    headGist: headGist,
    pullRequestBase: pullRequestBase,
    pullRequestHead: pullRequestHead
  }));
};

var renderHeader = function renderHeader(headerMessages) {
  if (headerMessages.length === 0) {
    return "";
  }

  return "---\n\n".concat(headerMessages.join("\n\n"), "\n\n---");
};

var renderBody = function renderBody(_ref2) {
  var baseReport = _ref2.baseReport,
      headReport = _ref2.headReport,
      pullRequestBase = _ref2.pullRequestBase,
      pullRequestHead = _ref2.pullRequestHead;
  return Object.keys(baseReport.categories).map(function (categoryName) {
    return renderCategory(categoryName, {
      baseReport: baseReport,
      headReport: headReport,
      pullRequestBase: pullRequestBase,
      pullRequestHead: pullRequestHead
    });
  }).join("\n\n");
};

var renderCategory = function renderCategory(category, _ref3) {
  var baseReport = _ref3.baseReport,
      headReport = _ref3.headReport,
      pullRequestBase = _ref3.pullRequestBase,
      pullRequestHead = _ref3.pullRequestHead;
  var baseScore = scoreToDisplayedScore(baseReport.categories[category].score);
  var headScore = scoreToDisplayedScore(headReport.categories[category].score);
  var diffScore = formatNumericDiff(headScore - baseScore);
  return "<details>\n  <summary>".concat(category, " (").concat(diffScore, ")</summary>\n  ").concat(renderCategoryScore(category, {
    baseReport: baseReport,
    headReport: headReport,
    pullRequestBase: pullRequestBase,
    pullRequestHead: pullRequestHead
  }), "\n  ").concat(renderCategoryAudits(category, {
    baseReport: baseReport,
    headReport: headReport,
    pullRequestBase: pullRequestBase,
    pullRequestHead: pullRequestHead
  }), "\n</details>");
};

var scoreToDisplayedScore = function scoreToDisplayedScore(score) {
  return twoDecimalsPrecision(score);
};

var twoDecimalsPrecision = function twoDecimalsPrecision(floatingNumber) {
  return Math.round(floatingNumber * 100) / 100;
};

var renderCategoryScore = function renderCategoryScore(category, _ref4) {
  var baseReport = _ref4.baseReport,
      headReport = _ref4.headReport,
      pullRequestBase = _ref4.pullRequestBase,
      pullRequestHead = _ref4.pullRequestHead;
  var headerCells = ["<th nowrap>Impact</th>", "<th nowrap>".concat(pullRequestBase, "</th>"), "<th nowrap>".concat(pullRequestHead, "</th>")];
  var baseScore = scoreToDisplayedScore(baseReport.categories[category].score);
  var headScore = scoreToDisplayedScore(headReport.categories[category].score);
  var bodyCells = ["<td nowrap>".concat(formatNumericDiff(headScore - baseScore), "</td>"), "<td nowrap>".concat(baseScore, "</td>"), "<td nowrap>".concat(headScore, "</td>")];
  return "<h3>Global impact on ".concat(category, "</h3>\n  <table>\n    <thead>\n      <tr>\n        ").concat(headerCells.join("\n        "), "\n      </tr>\n    </thead>\n    <tbody>\n      <tr>\n        ").concat(bodyCells.join("\n        "), "\n      </tr>\n    </tbody>\n  </table>");
};

var renderCategoryAudits = function renderCategoryAudits(category, _ref5) {
  var baseReport = _ref5.baseReport,
      headReport = _ref5.headReport,
      pullRequestBase = _ref5.pullRequestBase,
      pullRequestHead = _ref5.pullRequestHead;
  var impactedAuditsHeaderCells = ["<th nowrap>Audit</th>", "<th nowrap>Impact</th>", "<th nowrap>".concat(pullRequestBase, "</th>"), "<th nowrap>".concat(pullRequestHead, "</th>")];
  var auditRefs = baseReport.categories[category].auditRefs;
  var impactedAudits = [];
  auditRefs.forEach(function (auditRef) {
    var auditId = auditRef.id;
    var baseAudit = baseReport.audits[auditId];
    var headAudit = headReport.audits[auditId];
    var scoreDisplayMode = baseAudit.scoreDisplayMode; // manual checks cannot be compared
    // and there is definitely no use to display them

    if (scoreDisplayMode === "manual") {
      return;
    } // informative audit will mostly be skipped


    if (scoreDisplayMode === "informative") {
      var baseNumericValue = baseAudit.numericValue;
      var baseDisplayValue = baseAudit.displayValue;
      var headNumericValue = headAudit.numericValue;
      var headDisplayValue = headAudit.displayValue;

      if (typeof baseNumericValue !== "undefined") {
        impactedAudits.push(["<td nowrap>".concat(auditId, "</td>"), "<td nowrap>".concat(baseNumericValue === headNumericValue ? "none" : "---", "</td>"), "<td nowrap>".concat(typeof baseDisplayValue === "undefined" ? baseNumericValue : baseDisplayValue, "</td>"), "<td nowrap>".concat(typeof headDisplayValue === "undefined" ? headNumericValue : headDisplayValue, "</td>")]);
        return;
      }

      if (typeof baseDisplayValue !== "undefined") {
        impactedAudits.push(["<td nowrap>".concat(auditId, "</td>"), "<td nowrap>".concat(baseDisplayValue === headDisplayValue ? "none" : "---", "</td>"), "<td nowrap>".concat(baseDisplayValue, "</td>"), "<td nowrap>".concat(headDisplayValue, "</td>")]);
        return;
      }

      return;
    }

    if (scoreDisplayMode === "binary") {
      var baseScore = baseAudit.score;
      var headScore = headAudit.score;

      if (baseScore === headScore) {
        impactedAudits.push(["<td nowrap>".concat(auditId, "</td>"), "<td nowrap>none</td>", "<td nowrap>".concat(baseScore ? "✔" : "☓", "</td>"), "<td nowrap>".concat(baseScore ? "✔" : "☓", "</td>")]);
        return;
      }

      impactedAudits.push(["<td nowrap>".concat(auditId, "</td>"), "<td nowrap>\u2714</td>", "<td nowrap>\u2613</td>", "<td nowrap>\u2714</td>"]);
      return;
    }

    if (scoreDisplayMode === "numeric") {
      var _baseScore = baseAudit.score;
      var _headScore = headAudit.score;

      if (_baseScore === _headScore) {
        impactedAudits.push(["<td nowrap>".concat(auditId, "</td>"), "<td nowrap>none</td>", "<td nowrap>".concat(_baseScore, "</td>"), "<td nowrap>".concat(_headScore, "</td>")]);
        return;
      }

      impactedAudits.push(["<td nowrap>".concat(auditId, "</td>"), "<td nowrap>".concat(formatNumericDiff(_headScore - _baseScore), "</td>"), "<td nowrap>".concat(_baseScore, "</td>"), "<td nowrap>".concat(_headScore, "</td>")]);
      return;
    }

    impactedAudits.push(["<td nowrap>".concat(auditId, "</td>"), "<td nowrap>---</td>", "<td nowrap>---</td>", "<td nowrap>---</td>"]);
  });
  return "<h3>Detailed impact on ".concat(category, "</h3>\n  <table>\n    <thead>\n      <tr>\n        ").concat(impactedAuditsHeaderCells.join("\n        "), "\n      </tr>\n    </thead>\n    <tbody>\n      <tr>").concat(impactedAudits.map(function (cells) {
    return "\n        ".concat(cells.join("\n        "));
  }).join("\n      </tr>\n      <tr>"), "\n      </tr>\n    </tbody>\n  </table>");
};

var renderFooter = function renderFooter(_ref6) {
  var baseGist = _ref6.baseGist,
      headGist = _ref6.headGist,
      pullRequestBase = _ref6.pullRequestBase;
  return "".concat(baseGist ? "<sub>\n  Impact analyzed comparing <a href=\"".concat(gistIdToReportUrl(baseGist.id), "\">").concat(pullRequestBase, " report</a> and <a href=\"").concat(gistIdToReportUrl(headGist.id), "\">report after merge</a>\n</sub>\n<br />") : "", "\n<sub>\n  Generated by <a href=\"https://github.com/jsenv/jsenv-lighthouse-score-merge-impact\">lighthouse score merge impact</a>\n</sub>");
};

var gistIdToReportUrl = function gistIdToReportUrl(gistId) {
  return "https://googlechrome.github.io/lighthouse/viewer/?gist=".concat(gistId);
};

function _async$9(f) {
  return function () {
    for (var args = [], i = 0; i < arguments.length; i++) {
      args[i] = arguments[i];
    }

    try {
      return Promise.resolve(f.apply(this, args));
    } catch (e) {
      return Promise.reject(e);
    }
  };
}

function _call$1(body, then, direct) {
  if (direct) {
    return then ? then(body()) : body();
  }

  try {
    var result = Promise.resolve(body());
    return then ? result.then(then) : result;
  } catch (e) {
    return Promise.reject(e);
  }
}

function _await$7(value, then, direct) {
  if (direct) {
    return then ? then(value) : value;
  }

  if (!value || !value.then) {
    value = Promise.resolve(value);
  }

  return then ? value.then(then) : value;
}

function _catch$5(body, recover) {
  try {
    var result = body();
  } catch (e) {
    return recover(e);
  }

  if (result && result.then) {
    return result.then(void 0, recover);
  }

  return result;
}

function _continue$2(value, then) {
  return value && value.then ? value.then(then) : then(value);
}

function _invoke$2(body, then) {
  var result = body();

  if (result && result.then) {
    return result.then(then);
  }

  return then(result);
}

var reportLighthouseScoreMergeImpact = _async$9(function (generateLighthouseReport, _ref) {
  var _ref$cancellationToke = _ref.cancellationToken,
      cancellationToken = _ref$cancellationToke === void 0 ? createCancellationTokenForProcess() : _ref$cancellationToke,
      logLevel = _ref.logLevel,
      projectDirectoryUrl = _ref.projectDirectoryUrl,
      githubToken = _ref.githubToken,
      repositoryOwner = _ref.repositoryOwner,
      repositoryName = _ref.repositoryName,
      pullRequestNumber = _ref.pullRequestNumber;
  return wrapExternalFunction(_async$9(function () {
    projectDirectoryUrl = assertAndNormalizeDirectoryUrl(projectDirectoryUrl);

    if (typeof githubToken !== "string") {
      throw new TypeError("githubToken must be a string but received ".concat(githubToken));
    }

    if (typeof repositoryOwner !== "string") {
      throw new TypeError("repositoryOwner must be a string but received ".concat(repositoryOwner));
    }

    if (typeof repositoryName !== "string") {
      throw new TypeError("repositoryName must be a string but received ".concat(repositoryName));
    }

    pullRequestNumber = String(pullRequestNumber);

    if (typeof pullRequestNumber !== "string") {
      throw new TypeError("pullRequestNumber must be a string but received ".concat(pullRequestNumber));
    }

    var logger = createLogger({
      logLevel: logLevel
    });

    var execCommandInProjectDirectory = function execCommandInProjectDirectory(command) {
      return exec(command, {
        cwd: projectDirectoryUrl
      });
    };

    return _await$7(getPullRequest({
      repositoryOwner: repositoryOwner,
      repositoryName: repositoryName,
      pullRequestNumber: pullRequestNumber
    }, {
      cancellationToken: cancellationToken
    }), function (pullRequest) {
      // here we could detect fork and so on
      var pullRequestBase = pullRequest.base.ref;
      var pullRequestHead = pullRequest.head.ref;
      logger.debug("searching lighthouse comment in pull request ".concat(getPullRequestUrl({
        repositoryOwner: repositoryOwner,
        repositoryName: repositoryName,
        pullRequestNumber: pullRequestNumber
      })));
      return _await$7(createOperation({
        cancellationToken: cancellationToken,
        start: function start() {
          return getPullRequestCommentMatching(function (_ref2) {
            var body = _ref2.body;
            return body.match(/<!-- Generated by @jsenv\/github-pull-request-lighthouse-impact -->/);
          }, {
            githubToken: githubToken,
            repositoryOwner: repositoryOwner,
            repositoryName: repositoryName,
            pullRequestNumber: pullRequestNumber
          });
        }
      }), function (existingComment) {
        var _exit = false;

        if (existingComment) {
          logger.debug("comment found at ".concat(commentToUrl(existingComment), "."));
        } else {
          logger.debug("comment not found");
        }

        var patchOrPostComment = _async$9(function (commentBody) {
          var _exit4 = false;
          return _invoke$2(function () {
            if (existingComment) {
              logger.debug("updating comment at ".concat(commentToUrl(existingComment)));
              return _await$7(patchPullRequestComment(existingComment.id, commentBody, {
                repositoryOwner: repositoryOwner,
                repositoryName: repositoryName,
                pullRequestNumber: pullRequestNumber
              }, {
                githubToken: githubToken
              }), function (comment) {
                logger.log("comment updated");
                _exit4 = true;
                return comment;
              });
            }
          }, function (_result4) {
            if (_exit4) return _result4;
            logger.debug("creating comment");
            return _await$7(postPullRequestComment(commentBody, {
              repositoryOwner: repositoryOwner,
              repositoryName: repositoryName,
              pullRequestNumber: pullRequestNumber
            }, {
              githubToken: githubToken
            }), function (comment) {
              logger.debug("comment created at ".concat(commentToUrl(comment)));
              return comment;
            });
          });
        });

        var baseReport;
        return _continue$2(_catch$5(function () {
          return _await$7(execCommandInProjectDirectory("git fetch --no-tags --prune --depth=1 origin ".concat(pullRequestBase)), function () {
            return _await$7(execCommandInProjectDirectory("git checkout origin/".concat(pullRequestBase)), function () {
              return _await$7(execCommandInProjectDirectory("npm install"), function () {
                return _call$1(generateLighthouseReport, function (_generateLighthouseRe) {
                  baseReport = _generateLighthouseRe;
                });
              });
            });
          });
        }, function (error) {
          logger.error(error.stack);
          return _await$7(patchOrPostComment("<!-- Generated by @jsenv/github-pull-request-lighthouse-impact -->\n\n<h2>Lighthouse merge impact</h2>\n\n---\n\n**Error:** Error while trying to generate a report for ".concat(pullRequestBase, ".\n\n<pre>").concat(error.stack, "</pre>\n\n---")), function (comment) {
            _exit = true;
            return {
              error: error,
              comment: comment
            };
          });
        }), function (_result) {
          var _exit2 = false;
          if (_exit) return _result;
          var headReport;
          return _continue$2(_catch$5(function () {
            return _await$7(execCommandInProjectDirectory("git fetch --no-tags --prune origin ".concat(pullRequestHead)), function () {
              return _await$7(execCommandInProjectDirectory("git merge FETCH_HEAD"), function () {
                return _await$7(execCommandInProjectDirectory("npm install"), function () {
                  return _call$1(generateLighthouseReport, function (_generateLighthouseRe2) {
                    headReport = _generateLighthouseRe2;
                  });
                });
              });
            });
          }, function (error) {
            logger.error(error.stack);
            return _await$7(patchOrPostComment("<!-- Generated by @jsenv/github-pull-request-lighthouse-impact -->\n\n<h2>Lighthouse merge impact</h2>\n\n---\n\n**Error:** Error while trying to generate a report for ".concat(pullRequestHead, " merge into ").concat(pullRequestBase, ".\n\n<pre>").concat(error.stack, "</pre>\n\n---")), function (comment) {
              _exit2 = true;
              return {
                error: error,
                comment: comment
              };
            });
          }), function (_result2) {
            if (_exit2) return _result2;

            var patchOrPostGists = _async$9(function () {
              var baseGistId;
              var headGistId;

              if (existingComment) {
                var gistIds = commentToGistIds(existingComment);

                if (gistIds) {
                  baseGistId = gistIds.baseGistId;
                  headGistId = gistIds.headGistId;
                  logger.debug("gists found in comment body\n--- gist for base lighthouse report ---\n".concat(gistIdToUrl(baseGistId), "\n--- gist for head lighthouse report ---\n").concat(gistIdToUrl(headGistId)));
                } else {
                  logger.debug("cannot find gist id in comment body\n--- comment body ---\n".concat(existingComment.body));
                }
              }

              logger.debug("update or create both gists.");
              return _await$7(Promise.all([baseGistId ? getGist(baseGistId, {
                cancellationToken: cancellationToken,
                githubToken: githubToken
              }) : null, headGistId ? getGist(headGistId, {
                cancellationToken: cancellationToken,
                githubToken: githubToken
              }) : null]), function (_ref3) {
                var _ref4 = _slicedToArray(_ref3, 2),
                    baseGist = _ref4[0],
                    headGist = _ref4[1];

                var baseGistData = {
                  files: _defineProperty({}, "".concat(repositoryOwner, "-").concat(repositoryName, "-pr-").concat(pullRequestNumber, "-base-lighthouse-report.json"), {
                    content: JSON.stringify(baseReport)
                  })
                };
                var headGistData = {
                  files: _defineProperty({}, "".concat(repositoryOwner, "-").concat(repositoryName, "-pr-").concat(pullRequestNumber, "-merged-lighthouse-report.json"), {
                    content: JSON.stringify(headReport)
                  })
                };
                return _invoke$2(function () {
                  if (baseGist) {
                    logger.debug("base gist found, updating it");
                    return _await$7(patchGist(baseGist.id, baseGistData, {
                      cancellationToken: cancellationToken,
                      githubToken: githubToken
                    }), function (_patchGist) {
                      baseGist = _patchGist;
                    });
                  } else {
                    logger.debug("base gist not found, creating it");
                    return _await$7(postGist(baseGistData, {
                      cancellationToken: cancellationToken,
                      githubToken: githubToken
                    }), function (_postGist) {
                      baseGist = _postGist;
                    });
                  }
                }, function () {
                  return _invoke$2(function () {
                    if (headGist) {
                      logger.debug("head gist found, updating it");
                      return _await$7(patchGist(headGist.id, headGistData, {
                        cancellationToken: cancellationToken,
                        githubToken: githubToken
                      }), function (_patchGist2) {
                        headGist = _patchGist2;
                      });
                    } else {
                      logger.debug("head gist not found, creating it");
                      return _await$7(postGist(headGistData, {
                        cancellationToken: cancellationToken,
                        githubToken: githubToken
                      }), function (_postGist2) {
                        headGist = _postGist2;
                      });
                    }
                  }, function () {
                    return {
                      baseGist: baseGist,
                      headGist: headGist
                    };
                  });
                });
              });
            });

            var baseGist;
            var headGist;
            var headerMessages = [];
            return _continue$2(_catch$5(function () {
              return _call$1(patchOrPostGists, function (gists) {
                baseGist = gists.baseGist;
                headGist = gists.headGist;
              });
            }, function (e) {
              if (e.responseStatus === 401) {
                headerMessages.push("**Warning:** Link to lighthouse reports cannot be generated because github token is not allowed to create gists.");
              } else {
                throw e;
              }
            }), function (_result3) {
              return  _await$7(patchOrPostComment(generateCommentBody({
                headerMessages: headerMessages,
                baseReport: baseReport,
                headReport: headReport,
                baseGist: baseGist,
                headGist: headGist,
                pullRequestBase: pullRequestBase,
                pullRequestHead: pullRequestHead
              })), function (comment) {
                return {
                  baseGist: baseGist,
                  headGist: headGist,
                  comment: comment
                };
              });
            });
          });
        });
      });
    });
  }), {
    catchCancellation: true,
    unhandledRejectionStrict: true
  });
});
var baseGistIdRegex = new RegExp("<!-- base-gist-id=([a-zA-Z0-9_]+) -->");
var headGistIdRegex = new RegExp("<!-- head-gist-id=([a-zA-Z0-9_]+) -->");

var commentToGistIds = function commentToGistIds(comment) {
  var baseGistId = comment.body.match(baseGistIdRegex)[1];
  if (!baseGistId) return null;
  var headGistId = comment.body.match(headGistIdRegex)[1];
  if (!headGistId) return null;
  return {
    baseGistId: baseGistId,
    headGistId: headGistId
  };
};

var commentToUrl = function commentToUrl(comment) {
  return comment.html_url;
};

var gistIdToUrl = function gistIdToUrl(gistId) {
  return "https://gist.github.com/".concat(gistId);
};

var getPullRequestUrl = function getPullRequestUrl(_ref5) {
  var repositoryOwner = _ref5.repositoryOwner,
      repositoryName = _ref5.repositoryName,
      pullRequestNumber = _ref5.pullRequestNumber;
  return "https://github.com/".concat(repositoryOwner, "/").concat(repositoryName, "/pull/").concat(pullRequestNumber);
};

function _await$8(value, then, direct) {
  if (direct) {
    return then ? then(value) : value;
  }

  if (!value || !value.then) {
    value = Promise.resolve(value);
  }

  return then ? value.then(then) : value;
}

var require$2 = createRequire(import.meta.url);

function _async$a(f) {
  return function () {
    for (var args = [], i = 0; i < arguments.length; i++) {
      args[i] = arguments[i];
    }

    try {
      return Promise.resolve(f.apply(this, args));
    } catch (e) {
      return Promise.reject(e);
    }
  };
}

var _require = require$2("@actions/core"),
    getInput = _require.getInput;

function _invoke$3(body, then) {
  var result = body();

  if (result && result.then) {
    return result.then(then);
  }

  return then(result);
}

var run = _async$a(function () {
  var eventName = process.env.GITHUB_EVENT_NAME;

  if (!eventName) {
    throw new Error("missing process.env.GITHUB_EVENT_NAME, we are not in a github workflow");
  }

  if (eventName !== "pull_request") {
    throw new Error("must be called only in a pull request");
  }

  var githubToken = getInput("github-token") || process.env.GITHUB_TOKEN;
  var logLevel = getInput("log-level");
  var command = getInput("command");
  var outFilePath = getInput("command-outfile-path");
  var projectDirectoryUrl = process.cwd();
  var logger = createLogger({
    logLevel: logLevel
  });

  if (!githubToken) {
    throw new Error("missing githubToken");
  }

  var githubRepository = process.env.GITHUB_REPOSITORY;

  if (!githubRepository) {
    throw new Error("missing process.env.GITHUB_REPOSITORY");
  }

  var _githubRepository$spl = githubRepository.split("/"),
      _githubRepository$spl2 = _slicedToArray(_githubRepository$spl, 2),
      repositoryOwner = _githubRepository$spl2[0],
      repositoryName = _githubRepository$spl2[1];

  return _await$8(readPullRequestNumber({
    logger: logger
  }), function (pullRequestNumber) {
    return reportLighthouseScoreMergeImpact(_async$a(function () {
      return _await$8(exec(command), function () {
        var outFileUrl = resolveUrl(outFilePath, projectDirectoryUrl);
        return _await$8(readFile(outFileUrl), JSON.parse);
      });
    }), {
      logLevel: logLevel,
      projectDirectoryUrl: projectDirectoryUrl,
      githubToken: githubToken,
      repositoryOwner: repositoryOwner,
      repositoryName: repositoryName,
      pullRequestNumber: pullRequestNumber
    });
  });
});

var readPullRequestNumber = _async$a(function (_ref) {
  var _exit = false;
  var logger = _ref.logger;
  var githubRef = process.env.GITHUB_REF;

  if (!githubRef) {
    throw new Error("missing process.env.GITHUB_REF");
  }

  var pullRequestNumber = githubRefToPullRequestNumber(githubRef);
  if (pullRequestNumber) return pullRequestNumber; // https://github.com/actions/checkout/issues/58#issuecomment-589447479

  var githubEventFilePath = process.env.GITHUB_EVENT_PATH;
  return _invoke$3(function () {
    if (githubEventFilePath) {
      logger.warn("pull request number not found in process.env.GITHUB_REF, trying inside github event file.\n--- process.env.GITHUB_REF ---\n".concat(githubRef, "\n--- github event file path ---\n").concat(githubEventFilePath, "\n"));
      return _await$8(readFile(githubEventFilePath), function (githubEventFileContent) {
        var githubEvent = JSON.parse(githubEventFileContent);
        var pullRequestNumber = githubEvent.pull_request.number;
        logger.warn("pull request number found in the file: ".concat(pullRequestNumber));

        if (pullRequestNumber) {
          _exit = true;
          return pullRequestNumber;
        }
      });
    }
  }, function (_result) {
    if (_exit) return _result;
    throw new Error("cannot get pull request number from process.env.GITHUB_REF\n--- process.env.GITHUB_REF ---\n".concat(githubRef));
  });
});

var githubRefToPullRequestNumber = function githubRefToPullRequestNumber(githubRef) {
  var pullPrefix = "refs/pull/";
  var pullRequestNumberStartIndex = githubRef.indexOf(pullPrefix);
  if (pullRequestNumberStartIndex === -1) return undefined;
  var afterPull = githubRef.slice(pullRequestNumberStartIndex + pullPrefix.length);
  var slashAfterPullIndex = afterPull.indexOf("/");
  if (slashAfterPullIndex === -1) return undefined;
  var pullRequestNumberString = afterPull.slice(0, slashAfterPullIndex);
  return Number(pullRequestNumberString);
};

var action = run();

export default action;
//# sourceMappingURL=action.js.map
