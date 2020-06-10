'use strict';

var module$1 = require('module');
var url$1 = require('url');
var fs = require('fs');
var crypto = require('crypto');
var path = require('path');
var util = require('util');
var child_process = require('child_process');
var https = require('https');
require('net');
require('http');
require('stream');
require('os');

/* global require, __filename */
const nodeRequire = require;
const filenameContainsBackSlashes = __filename.indexOf("\\") > -1;
const url = filenameContainsBackSlashes ? `file:///${__filename.replace(/\\/g, "/")}` : `file://${__filename}`;

const LOG_LEVEL_OFF = "off";
const LOG_LEVEL_DEBUG = "debug";
const LOG_LEVEL_INFO = "info";
const LOG_LEVEL_WARN = "warn";
const LOG_LEVEL_ERROR = "error";

const createLogger = ({
  logLevel = LOG_LEVEL_INFO
} = {}) => {
  if (logLevel === LOG_LEVEL_DEBUG) {
    return {
      debug,
      info,
      warn,
      error
    };
  }

  if (logLevel === LOG_LEVEL_INFO) {
    return {
      debug: debugDisabled,
      info,
      warn,
      error
    };
  }

  if (logLevel === LOG_LEVEL_WARN) {
    return {
      debug: debugDisabled,
      info: infoDisabled,
      warn,
      error
    };
  }

  if (logLevel === LOG_LEVEL_ERROR) {
    return {
      debug: debugDisabled,
      info: infoDisabled,
      warn: warnDisabled,
      error
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

  throw new Error(`unexpected logLevel.
--- logLevel ---
${logLevel}
--- allowed log levels ---
${LOG_LEVEL_OFF}
${LOG_LEVEL_ERROR}
${LOG_LEVEL_WARN}
${LOG_LEVEL_INFO}
${LOG_LEVEL_DEBUG}`);
};
const debug = console.debug;

const debugDisabled = () => {};

const info = console.info;

const infoDisabled = () => {};

const warn = console.warn;

const warnDisabled = () => {};

const error = console.error;

const errorDisabled = () => {};

const ensureUrlTrailingSlash = url => {
  return url.endsWith("/") ? url : `${url}/`;
};

const isFileSystemPath = value => {
  if (typeof value !== "string") {
    throw new TypeError(`isFileSystemPath first arg must be a string, got ${value}`);
  }

  if (value[0] === "/") return true;
  return startsWithWindowsDriveLetter(value);
};

const startsWithWindowsDriveLetter = string => {
  const firstChar = string[0];
  if (!/[a-zA-Z]/.test(firstChar)) return false;
  const secondChar = string[1];
  if (secondChar !== ":") return false;
  return true;
};

const fileSystemPathToUrl = value => {
  if (!isFileSystemPath(value)) {
    throw new Error(`received an invalid value for fileSystemPath: ${value}`);
  }

  return String(url$1.pathToFileURL(value));
};

const assertAndNormalizeDirectoryUrl = value => {
  let urlString;

  if (value instanceof URL) {
    urlString = value.href;
  } else if (typeof value === "string") {
    if (isFileSystemPath(value)) {
      urlString = fileSystemPathToUrl(value);
    } else {
      try {
        urlString = String(new URL(value));
      } catch (e) {
        throw new TypeError(`directoryUrl must be a valid url, received ${value}`);
      }
    }
  } else {
    throw new TypeError(`directoryUrl must be a string or an url, received ${value}`);
  }

  if (!urlString.startsWith("file://")) {
    throw new Error(`directoryUrl must starts with file://, received ${value}`);
  }

  return ensureUrlTrailingSlash(urlString);
};

const assertAndNormalizeFileUrl = (value, baseUrl) => {
  let urlString;

  if (value instanceof URL) {
    urlString = value.href;
  } else if (typeof value === "string") {
    if (isFileSystemPath(value)) {
      urlString = fileSystemPathToUrl(value);
    } else {
      try {
        urlString = String(new URL(value, baseUrl));
      } catch (e) {
        throw new TypeError(`fileUrl must be a valid url, received ${value}`);
      }
    }
  } else {
    throw new TypeError(`fileUrl must be a string or an url, received ${value}`);
  }

  if (!urlString.startsWith("file://")) {
    throw new Error(`fileUrl must starts with file://, received ${value}`);
  }

  return urlString;
};

const urlToFileSystemPath = fileUrl => {
  if (fileUrl[fileUrl.length - 1] === "/") {
    // remove trailing / so that nodejs path becomes predictable otherwise it logs
    // the trailing slash on linux but does not on windows
    fileUrl = fileUrl.slice(0, -1);
  }

  const fileSystemPath = url$1.fileURLToPath(fileUrl);
  return fileSystemPath;
};

const isWindows = process.platform === "win32";

const createCancellationToken = () => {
  const register = callback => {
    if (typeof callback !== "function") {
      throw new Error(`callback must be a function, got ${callback}`);
    }

    return {
      callback,
      unregister: () => {}
    };
  };

  const throwIfRequested = () => undefined;

  return {
    register,
    cancellationRequested: false,
    throwIfRequested
  };
};

const createOperation = ({
  cancellationToken = createCancellationToken(),
  start,
  ...rest
}) => {
  const unknownArgumentNames = Object.keys(rest);

  if (unknownArgumentNames.length) {
    throw new Error(`createOperation called with unknown argument names.
--- unknown argument names ---
${unknownArgumentNames}
--- possible argument names ---
cancellationToken
start`);
  }

  cancellationToken.throwIfRequested();
  const promise = new Promise(resolve => {
    resolve(start());
  });
  const cancelPromise = new Promise((resolve, reject) => {
    const cancelRegistration = cancellationToken.register(cancelError => {
      cancelRegistration.unregister();
      reject(cancelError);
    });
    promise.then(cancelRegistration.unregister, () => {});
  });
  const operationPromise = Promise.race([promise, cancelPromise]);
  return operationPromise;
};

const createCancelError = reason => {
  const cancelError = new Error(`canceled because ${reason}`);
  cancelError.name = "CANCEL_ERROR";
  cancelError.reason = reason;
  return cancelError;
};
const isCancelError = value => {
  return value && typeof value === "object" && value.name === "CANCEL_ERROR";
};

const arrayWithout = (array, item) => {
  const arrayWithoutItem = [];
  let i = 0;

  while (i < array.length) {
    const value = array[i];
    i++;

    if (value === item) {
      continue;
    }

    arrayWithoutItem.push(value);
  }

  return arrayWithoutItem;
};

// https://github.com/tc39/proposal-cancellation/tree/master/stage0
const createCancellationSource = () => {
  let requested = false;
  let cancelError;
  let registrationArray = [];

  const cancel = reason => {
    if (requested) return;
    requested = true;
    cancelError = createCancelError(reason);
    const registrationArrayCopy = registrationArray.slice();
    registrationArray.length = 0;
    registrationArrayCopy.forEach(registration => {
      registration.callback(cancelError); // const removedDuringCall = registrationArray.indexOf(registration) === -1
    });
  };

  const register = callback => {
    if (typeof callback !== "function") {
      throw new Error(`callback must be a function, got ${callback}`);
    }

    const existingRegistration = registrationArray.find(registration => {
      return registration.callback === callback;
    }); // don't register twice

    if (existingRegistration) {
      return existingRegistration;
    }

    const registration = {
      callback,
      unregister: () => {
        registrationArray = arrayWithout(registrationArray, registration);
      }
    };
    registrationArray = [registration, ...registrationArray];
    return registration;
  };

  const throwIfRequested = () => {
    if (requested) {
      throw cancelError;
    }
  };

  return {
    token: {
      register,

      get cancellationRequested() {
        return requested;
      },

      throwIfRequested
    },
    cancel
  };
};

const getCommandArgument = (argv, name) => {
  let i = 0;

  while (i < argv.length) {
    const arg = argv[i];

    if (arg === name) {
      return {
        name,
        index: i,
        value: ""
      };
    }

    if (arg.startsWith(`${name}=`)) {
      return {
        name,
        index: i,
        value: arg.slice(`${name}=`.length)
      };
    }

    i++;
  }

  return null;
};

const wrapExternalFunction = (fn, {
  catchCancellation = false,
  unhandledRejectionStrict = false
} = {}) => {
  if (catchCancellation) {
    const previousFn = fn;

    fn = async () => {
      try {
        const value = await previousFn();
        return value;
      } catch (error) {
        if (isCancelError(error)) {
          // it means consume of the function will resolve with a cancelError
          // but when you cancel it means you're not interested in the result anymore
          // thanks to this it avoid unhandledRejection
          return error;
        }

        throw error;
      }
    };
  }

  if (unhandledRejectionStrict) {
    const previousFn = fn;

    fn = async () => {
      const uninstall = installUnhandledRejectionStrict();

      try {
        const value = await previousFn();
        uninstall();
        return value;
      } catch (e) {
        // don't remove it immediatly to let nodejs emit the unhandled rejection
        setTimeout(() => {
          uninstall();
        });
        throw e;
      }
    };
  }

  return fn();
};

const installUnhandledRejectionStrict = () => {
  const unhandledRejectionArg = getCommandArgument(process.execArgv, "--unhandled-rejections");
  if (unhandledRejectionArg === "strict") return () => {};

  const onUnhandledRejection = reason => {
    throw reason;
  };

  process.once("unhandledRejection", onUnhandledRejection);
  return () => {
    process.removeListener("unhandledRejection", onUnhandledRejection);
  };
};

const resolveUrl = (specifier, baseUrl) => {
  if (typeof baseUrl === "undefined") {
    throw new TypeError(`baseUrl missing to resolve ${specifier}`);
  }

  return String(new URL(specifier, baseUrl));
};

const isWindows$1 = process.platform === "win32";
const baseUrlFallback = fileSystemPathToUrl(process.cwd());

const isWindows$2 = process.platform === "win32";

const addCallback = callback => {
  const triggerHangUpOrDeath = () => callback(); // SIGHUP http://man7.org/linux/man-pages/man7/signal.7.html


  process.once("SIGUP", triggerHangUpOrDeath);
  return () => {
    process.removeListener("SIGUP", triggerHangUpOrDeath);
  };
};

const SIGUPSignal = {
  addCallback
};

const addCallback$1 = callback => {
  // SIGINT is CTRL+C from keyboard also refered as keyboard interruption
  // http://man7.org/linux/man-pages/man7/signal.7.html
  // may also be sent by vscode https://github.com/Microsoft/vscode-node-debug/issues/1#issuecomment-405185642
  process.once("SIGINT", callback);
  return () => {
    process.removeListener("SIGINT", callback);
  };
};

const SIGINTSignal = {
  addCallback: addCallback$1
};

const addCallback$2 = callback => {
  if (process.platform === "win32") {
    console.warn(`SIGTERM is not supported on windows`);
    return () => {};
  }

  const triggerTermination = () => callback(); // SIGTERM http://man7.org/linux/man-pages/man7/signal.7.html


  process.once("SIGTERM", triggerTermination);
  return () => {
    process.removeListener("SIGTERM", triggerTermination);
  };
};

const SIGTERMSignal = {
  addCallback: addCallback$2
};

let beforeExitCallbackArray = [];
let uninstall;

const addCallback$3 = callback => {
  if (beforeExitCallbackArray.length === 0) uninstall = install();
  beforeExitCallbackArray = [...beforeExitCallbackArray, callback];
  return () => {
    if (beforeExitCallbackArray.length === 0) return;
    beforeExitCallbackArray = beforeExitCallbackArray.filter(beforeExitCallback => beforeExitCallback !== callback);
    if (beforeExitCallbackArray.length === 0) uninstall();
  };
};

const install = () => {
  const onBeforeExit = () => {
    return beforeExitCallbackArray.reduce(async (previous, callback) => {
      await previous;
      return callback();
    }, Promise.resolve());
  };

  process.once("beforeExit", onBeforeExit);
  return () => {
    process.removeListener("beforeExit", onBeforeExit);
  };
};

const beforeExitSignal = {
  addCallback: addCallback$3
};

const addCallback$4 = (callback, {
  collectExceptions = false
} = {}) => {
  if (!collectExceptions) {
    const exitCallback = () => {
      callback();
    };

    process.on("exit", exitCallback);
    return () => {
      process.removeListener("exit", exitCallback);
    };
  }

  const {
    getExceptions,
    stop
  } = trackExceptions();

  const exitCallback = () => {
    process.removeListener("exit", exitCallback);
    stop();
    callback({
      exceptionArray: getExceptions().map(({
        exception,
        origin
      }) => {
        return {
          exception,
          origin
        };
      })
    });
  };

  process.on("exit", exitCallback);
  return () => {
    process.removeListener("exit", exitCallback);
  };
};

const trackExceptions = () => {
  let exceptionArray = [];

  const unhandledRejectionCallback = (unhandledRejection, promise) => {
    exceptionArray = [...exceptionArray, {
      origin: "unhandledRejection",
      exception: unhandledRejection,
      promise
    }];
  };

  const rejectionHandledCallback = promise => {
    exceptionArray = exceptionArray.filter(exceptionArray => exceptionArray.promise !== promise);
  };

  const uncaughtExceptionCallback = (uncaughtException, origin) => {
    // since node 12.4 https://nodejs.org/docs/latest-v12.x/api/process.html#process_event_uncaughtexception
    if (origin === "unhandledRejection") return;
    exceptionArray = [...exceptionArray, {
      origin: "uncaughtException",
      exception: uncaughtException
    }];
  };

  process.on("unhandledRejection", unhandledRejectionCallback);
  process.on("rejectionHandled", rejectionHandledCallback);
  process.on("uncaughtException", uncaughtExceptionCallback);
  return {
    getExceptions: () => exceptionArray,
    stop: () => {
      process.removeListener("unhandledRejection", unhandledRejectionCallback);
      process.removeListener("rejectionHandled", rejectionHandledCallback);
      process.removeListener("uncaughtException", uncaughtExceptionCallback);
    }
  };
};

const exitSignal = {
  addCallback: addCallback$4
};

const addCallback$5 = callback => {
  return eventRace({
    SIGHUP: {
      register: SIGUPSignal.addCallback,
      callback: () => callback("SIGHUP")
    },
    SIGINT: {
      register: SIGINTSignal.addCallback,
      callback: () => callback("SIGINT")
    },
    ...(process.platform === "win32" ? {} : {
      SIGTERM: {
        register: SIGTERMSignal.addCallback,
        callback: () => callback("SIGTERM")
      }
    }),
    beforeExit: {
      register: beforeExitSignal.addCallback,
      callback: () => callback("beforeExit")
    },
    exit: {
      register: exitSignal.addCallback,
      callback: () => callback("exit")
    }
  });
};

const eventRace = eventMap => {
  const unregisterMap = {};

  const unregisterAll = reason => {
    return Object.keys(unregisterMap).map(name => unregisterMap[name](reason));
  };

  Object.keys(eventMap).forEach(name => {
    const {
      register,
      callback
    } = eventMap[name];
    unregisterMap[name] = register((...args) => {
      unregisterAll();
      callback(...args);
    });
  });
  return unregisterAll;
};

const teardownSignal = {
  addCallback: addCallback$5
};

const createCancellationTokenForProcess = () => {
  const teardownCancelSource = createCancellationSource();
  teardownSignal.addCallback(reason => teardownCancelSource.cancel(`process ${reason}`));
  return teardownCancelSource.token;
};

const readFilePromisified = util.promisify(fs.readFile);
const readFile = async value => {
  const fileUrl = assertAndNormalizeFileUrl(value);
  const filePath = urlToFileSystemPath(fileUrl);
  const buffer = await readFilePromisified(filePath);
  return buffer.toString();
};

const isWindows$3 = process.platform === "win32";

/* eslint-disable import/max-dependencies */
const isLinux = process.platform === "linux"; // linux does not support recursive option

const exec = (command, {
  cwd,
  onLog = () => {},
  onErrorLog = () => {}
} = {}) => {
  return new Promise((resolve, reject) => {
    const command = child_process.exec(command, {
      cwd,
      stdio: "silent"
    }, error => {
      if (error) {
        reject(error);
      } else {
        resolve();
      }
    });
    command.stdout.on("data", data => {
      onLog(data);
    });
    command.stderr.on("data", data => {
      // debug because this output is part of
      // the error message generated by a failing npm publish
      onErrorLog(data);
    });
  });
};

const convertFileSystemErrorToResponseProperties = error => {
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

const isErrorWithCode = (error, code) => {
  return typeof error === "object" && error.code === code;
};

if ("observable" in Symbol === false) {
  Symbol.observable = Symbol.for("observable");
}

const ensureUrlTrailingSlash$1 = url => {
  return url.endsWith("/") ? url : `${url}/`;
};

const isFileSystemPath$1 = value => {
  if (typeof value !== "string") {
    throw new TypeError(`isFileSystemPath first arg must be a string, got ${value}`);
  }

  if (value[0] === "/") return true;
  return startsWithWindowsDriveLetter$1(value);
};

const startsWithWindowsDriveLetter$1 = string => {
  const firstChar = string[0];
  if (!/[a-zA-Z]/.test(firstChar)) return false;
  const secondChar = string[1];
  if (secondChar !== ":") return false;
  return true;
};

const fileSystemPathToUrl$1 = value => {
  if (!isFileSystemPath$1(value)) {
    throw new Error(`received an invalid value for fileSystemPath: ${value}`);
  }

  return String(url$1.pathToFileURL(value));
};

const assertAndNormalizeDirectoryUrl$1 = value => {
  let urlString;

  if (value instanceof URL) {
    urlString = value.href;
  } else if (typeof value === "string") {
    if (isFileSystemPath$1(value)) {
      urlString = fileSystemPathToUrl$1(value);
    } else {
      try {
        urlString = String(new URL(value));
      } catch (e) {
        throw new TypeError(`directoryUrl must be a valid url, received ${value}`);
      }
    }
  } else {
    throw new TypeError(`directoryUrl must be a string or an url, received ${value}`);
  }

  if (!urlString.startsWith("file://")) {
    throw new Error(`directoryUrl must starts with file://, received ${value}`);
  }

  return ensureUrlTrailingSlash$1(urlString);
};

const assertAndNormalizeFileUrl$1 = (value, baseUrl) => {
  let urlString;

  if (value instanceof URL) {
    urlString = value.href;
  } else if (typeof value === "string") {
    if (isFileSystemPath$1(value)) {
      urlString = fileSystemPathToUrl$1(value);
    } else {
      try {
        urlString = String(new URL(value, baseUrl));
      } catch (e) {
        throw new TypeError(`fileUrl must be a valid url, received ${value}`);
      }
    }
  } else {
    throw new TypeError(`fileUrl must be a string or an url, received ${value}`);
  }

  if (!urlString.startsWith("file://")) {
    throw new Error(`fileUrl must starts with file://, received ${value}`);
  }

  return urlString;
};

const urlToFileSystemPath$1 = fileUrl => {
  if (fileUrl[fileUrl.length - 1] === "/") {
    // remove trailing / so that nodejs path becomes predictable otherwise it logs
    // the trailing slash on linux but does not on windows
    fileUrl = fileUrl.slice(0, -1);
  }

  const fileSystemPath = url$1.fileURLToPath(fileUrl);
  return fileSystemPath;
};

// https://github.com/coderaiser/cloudcmd/issues/63#issuecomment-195478143
// https://nodejs.org/api/fs.html#fs_file_modes
// https://github.com/TooTallNate/stat-mode
// cannot get from fs.constants because they are not available on windows
const S_IRUSR = 256;
/* 0000400 read permission, owner */

const S_IWUSR = 128;
/* 0000200 write permission, owner */

const S_IXUSR = 64;
/* 0000100 execute/search permission, owner */

const S_IRGRP = 32;
/* 0000040 read permission, group */

const S_IWGRP = 16;
/* 0000020 write permission, group */

const S_IXGRP = 8;
/* 0000010 execute/search permission, group */

const S_IROTH = 4;
/* 0000004 read permission, others */

const S_IWOTH = 2;
/* 0000002 write permission, others */

const S_IXOTH = 1;
const permissionsToBinaryFlags = ({
  owner,
  group,
  others
}) => {
  let binaryFlags = 0;
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

const writeFileSystemNodePermissions = async (source, permissions) => {
  const sourceUrl = assertAndNormalizeFileUrl$1(source);
  const sourcePath = urlToFileSystemPath$1(sourceUrl);
  let binaryFlags;

  if (typeof permissions === "object") {
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
};

const chmodNaive = (fileSystemPath, binaryFlags) => {
  return new Promise((resolve, reject) => {
    fs.chmod(fileSystemPath, binaryFlags, error => {
      if (error) {
        reject(error);
      } else {
        resolve();
      }
    });
  });
};

const actionLevels = {
  read: 0,
  write: 1,
  execute: 2
};
const subjectLevels = {
  others: 0,
  group: 1,
  owner: 2
};

const getPermissionOrComputeDefault = (action, subject, permissions) => {
  if (subject in permissions) {
    const subjectPermissions = permissions[subject];

    if (action in subjectPermissions) {
      return subjectPermissions[action];
    }

    const actionLevel = actionLevels[action];
    const actionFallback = Object.keys(actionLevels).find(actionFallbackCandidate => actionLevels[actionFallbackCandidate] > actionLevel && actionFallbackCandidate in subjectPermissions);

    if (actionFallback) {
      return subjectPermissions[actionFallback];
    }
  }

  const subjectLevel = subjectLevels[subject]; // do we have a subject with a stronger level (group or owner)
  // where we could read the action permission ?

  const subjectFallback = Object.keys(subjectLevels).find(subjectFallbackCandidate => subjectLevels[subjectFallbackCandidate] > subjectLevel && subjectFallbackCandidate in permissions);

  if (subjectFallback) {
    const subjectPermissions = permissions[subjectFallback];
    return action in subjectPermissions ? subjectPermissions[action] : getPermissionOrComputeDefault(action, subjectFallback, permissions);
  }

  return false;
};

const isWindows$4 = process.platform === "win32";
const readFileSystemNodeStat = async (source, {
  nullIfNotFound = false,
  followLink = true
} = {}) => {
  if (source.endsWith("/")) source = source.slice(0, -1);
  const sourceUrl = assertAndNormalizeFileUrl$1(source);
  const sourcePath = urlToFileSystemPath$1(sourceUrl);
  const handleNotFoundOption = nullIfNotFound ? {
    handleNotFoundError: () => null
  } : {};
  return readStat(sourcePath, {
    followLink,
    ...handleNotFoundOption,
    ...(isWindows$4 ? {
      // Windows can EPERM on stat
      handlePermissionDeniedError: async error => {
        // unfortunately it means we mutate the permissions
        // without being able to restore them to the previous value
        // (because reading current permission would also throw)
        try {
          await writeFileSystemNodePermissions(sourceUrl, 0o666);
          const stats = await readStat(sourcePath, {
            followLink,
            ...handleNotFoundOption,
            // could not fix the permission error, give up and throw original error
            handlePermissionDeniedError: () => {
              throw error;
            }
          });
          return stats;
        } catch (e) {
          // failed to write permission or readState, throw original error as well
          throw error;
        }
      }
    } : {})
  });
};

const readStat = (sourcePath, {
  followLink,
  handleNotFoundError = null,
  handlePermissionDeniedError = null
} = {}) => {
  const nodeMethod = followLink ? fs.stat : fs.lstat;
  return new Promise((resolve, reject) => {
    nodeMethod(sourcePath, (error, statsObject) => {
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

const ETAG_FOR_EMPTY_CONTENT = '"0-2jmj7l5rSw0yVb/vlWAYkK/YBwk"';
const bufferToEtag = buffer => {
  if (!Buffer.isBuffer(buffer)) {
    throw new TypeError(`buffer expected, got ${buffer}`);
  }

  if (buffer.length === 0) {
    return ETAG_FOR_EMPTY_CONTENT;
  }

  const hash = crypto.createHash("sha1");
  hash.update(buffer, "utf8");
  const hashBase64String = hash.digest("base64");
  const hashBase64StringSubset = hashBase64String.slice(0, 27);
  const length = buffer.length;
  return `"${length.toString(16)}-${hashBase64StringSubset}"`;
};

const readDirectory = async (url, {
  emfileMaxWait = 1000
} = {}) => {
  const directoryUrl = assertAndNormalizeDirectoryUrl$1(url);
  const directoryPath = urlToFileSystemPath$1(directoryUrl);
  const startMs = Date.now();
  let attemptCount = 0;

  const attempt = () => {
    return readdirNaive(directoryPath, {
      handleTooManyFilesOpenedError: async error => {
        attemptCount++;
        const nowMs = Date.now();
        const timeSpentWaiting = nowMs - startMs;

        if (timeSpentWaiting > emfileMaxWait) {
          throw error;
        }

        return new Promise(resolve => {
          setTimeout(() => {
            resolve(attempt());
          }, attemptCount);
        });
      }
    });
  };

  return attempt();
};

const readdirNaive = (directoryPath, {
  handleTooManyFilesOpenedError = null
} = {}) => {
  return new Promise((resolve, reject) => {
    fs.readdir(directoryPath, (error, names) => {
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

const isWindows$5 = process.platform === "win32";
const baseUrlFallback$1 = fileSystemPathToUrl$1(process.cwd());

const isWindows$6 = process.platform === "win32";

const readFilePromisified$1 = util.promisify(fs.readFile);

const isWindows$7 = process.platform === "win32";

/* eslint-disable import/max-dependencies */
const isLinux$1 = process.platform === "linux"; // linux does not support recursive option

const jsenvContentTypeMap = {
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

// https://github.com/jshttp/mime-db/blob/master/src/apache-types.json
const urlToContentType = (url, contentTypeMap = jsenvContentTypeMap, contentTypeDefault = "application/octet-stream") => {
  if (typeof contentTypeMap !== "object") {
    throw new TypeError(`contentTypeMap must be an object, got ${contentTypeMap}`);
  }

  const pathname = new URL(url).pathname;
  const extensionWithDot = path.extname(pathname);

  if (!extensionWithDot || extensionWithDot === ".") {
    return contentTypeDefault;
  }

  const extension = extensionWithDot.slice(1);
  const availableContentTypes = Object.keys(contentTypeMap);
  const contentTypeForExtension = availableContentTypes.find(contentTypeName => {
    const contentType = contentTypeMap[contentTypeName];
    return contentType.extensions && contentType.extensions.indexOf(extension) > -1;
  });
  return contentTypeForExtension || contentTypeDefault;
};

const {
  readFile: readFile$1
} = fs.promises;
const serveFile = async (source, {
  cancellationToken = createCancellationToken(),
  method = "GET",
  headers = {},
  canReadDirectory = false,
  cacheStrategy = "etag",
  contentTypeMap = jsenvContentTypeMap
} = {}) => {
  if (method !== "GET" && method !== "HEAD") {
    return {
      status: 501
    };
  }

  const sourceUrl = assertAndNormalizeFileUrl$1(source);
  const clientCacheDisabled = headers["cache-control"] === "no-cache";

  try {
    const cacheWithMtime = !clientCacheDisabled && cacheStrategy === "mtime";
    const cacheWithETag = !clientCacheDisabled && cacheStrategy === "etag";
    const cachedDisabled = clientCacheDisabled || cacheStrategy === "none";
    const sourceStat = await createOperation({
      cancellationToken,
      start: () => readFileSystemNodeStat(sourceUrl)
    });

    if (sourceStat.isDirectory()) {
      if (canReadDirectory === false) {
        return {
          status: 403,
          statusText: "not allowed to read directory",
          headers: { ...(cachedDisabled ? {
              "cache-control": "no-store"
            } : {})
          }
        };
      }

      const directoryContentArray = await createOperation({
        cancellationToken,
        start: () => readDirectory(sourceUrl)
      });
      const directoryContentJson = JSON.stringify(directoryContentArray);
      return {
        status: 200,
        headers: { ...(cachedDisabled ? {
            "cache-control": "no-store"
          } : {}),
          "content-type": "application/json",
          "content-length": directoryContentJson.length
        },
        body: directoryContentJson
      };
    } // not a file, give up


    if (!sourceStat.isFile()) {
      return {
        status: 404,
        headers: { ...(cachedDisabled ? {
            "cache-control": "no-store"
          } : {})
        }
      };
    }

    if (cacheWithETag) {
      const fileContentAsBuffer = await createOperation({
        cancellationToken,
        start: () => readFile$1(urlToFileSystemPath$1(sourceUrl))
      });
      const fileContentEtag = bufferToEtag(fileContentAsBuffer);

      if ("if-none-match" in headers && headers["if-none-match"] === fileContentEtag) {
        return {
          status: 304,
          headers: { ...(cachedDisabled ? {
              "cache-control": "no-store"
            } : {})
          }
        };
      }

      return {
        status: 200,
        headers: { ...(cachedDisabled ? {
            "cache-control": "no-store"
          } : {}),
          "content-length": sourceStat.size,
          "content-type": urlToContentType(sourceUrl, contentTypeMap),
          "etag": fileContentEtag
        },
        body: fileContentAsBuffer
      };
    }

    if (cacheWithMtime && "if-modified-since" in headers) {
      let cachedModificationDate;

      try {
        cachedModificationDate = new Date(headers["if-modified-since"]);
      } catch (e) {
        return {
          status: 400,
          statusText: "if-modified-since header is not a valid date"
        };
      }

      const actualModificationDate = dateToSecondsPrecision(sourceStat.mtime);

      if (Number(cachedModificationDate) >= Number(actualModificationDate)) {
        return {
          status: 304
        };
      }
    }

    return {
      status: 200,
      headers: { ...(cachedDisabled ? {
          "cache-control": "no-store"
        } : {}),
        ...(cacheWithMtime ? {
          "last-modified": dateToUTCString(sourceStat.mtime)
        } : {}),
        "content-length": sourceStat.size,
        "content-type": urlToContentType(sourceUrl, contentTypeMap)
      },
      body: fs.createReadStream(urlToFileSystemPath$1(sourceUrl))
    };
  } catch (e) {
    return convertFileSystemErrorToResponseProperties(e);
  }
}; // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/toUTCString

const dateToUTCString = date => date.toUTCString();

const dateToSecondsPrecision = date => {
  const dateWithSecondsPrecision = new Date(date);
  dateWithSecondsPrecision.setMilliseconds(0);
  return dateWithSecondsPrecision;
};

const require$1 = module$1.createRequire(url);

const nodeFetch = require$1("node-fetch");

const AbortController = require$1("abort-controller");

const {
  Response
} = nodeFetch;
const fetchUrl = async (url, {
  cancellationToken = createCancellationToken(),
  simplified = false,
  ignoreHttpsError = false,
  canReadDirectory,
  contentTypeMap,
  cacheStrategy,
  ...options
} = {}) => {
  try {
    url = String(new URL(url));
  } catch (e) {
    throw new Error(`fetchUrl first argument must be an absolute url, received ${url}`);
  }

  if (url.startsWith("file://")) {
    const {
      status,
      statusText,
      headers,
      body
    } = await serveFile(url, {
      cancellationToken,
      cacheStrategy,
      canReadDirectory,
      contentTypeMap,
      ...options
    });
    const response = new Response(typeof body === "string" ? Buffer.from(body) : body, {
      url,
      status,
      statusText,
      headers
    });
    return simplified ? standardResponseToSimplifiedResponse(response) : response;
  } // cancellation might be requested early, abortController does not support that
  // so we have to throw if requested right away


  cancellationToken.throwIfRequested(); // https://github.com/bitinn/node-fetch#request-cancellation-with-abortsignal

  const abortController = new AbortController();
  let cancelError;
  cancellationToken.register(reason => {
    cancelError = reason;
    abortController.abort(reason);
  });
  let response;

  try {
    response = await nodeFetch(url, {
      signal: abortController.signal,
      ...(ignoreHttpsError && url.startsWith("https") ? {
        agent: new https.Agent({
          rejectUnauthorized: false
        })
      } : {}),
      ...options
    });
  } catch (e) {
    if (cancelError && e.name === "AbortError") {
      throw cancelError;
    }

    throw e;
  }

  return simplified ? standardResponseToSimplifiedResponse(response) : response;
};

const standardResponseToSimplifiedResponse = async response => {
  const text = await response.text();
  return {
    url: response.url,
    status: response.status,
    statusText: response.statusText,
    headers: responseToHeaders(response),
    body: text
  };
};

const responseToHeaders = response => {
  const headers = {};
  response.headers.forEach((value, name) => {
    headers[name] = value;
  });
  return headers;
};

const require$2 = module$1.createRequire(url);

const killPort = require$2("kill-port");

const getGithubRessource = async (url, {
  githubToken,
  cancellationToken
} = {}) => {
  return sendHttpRequest(url, {
    cancellationToken,
    method: "GET",
    headers: {
      authorization: `token ${githubToken}`
    },
    responseStatusMap: {
      200: async response => {
        const json = await response.json();
        return json;
      },
      404: () => null
    }
  });
};
const postGithubRessource = (url, body, {
  cancellationToken,
  githubToken
} = {}) => {
  const bodyAsString = JSON.stringify(body);
  return sendHttpRequest(url, {
    cancellationToken,
    method: "POST",
    headers: {
      "authorization": `token ${githubToken}`,
      "content-length": Buffer.byteLength(bodyAsString)
    },
    body: bodyAsString,
    responseStatusMap: {
      201: async response => {
        const json = await response.json();
        return json;
      }
    }
  });
};
const patchGithubRessource = async (url, body, {
  cancellationToken,
  githubToken
} = {}) => {
  const bodyAsString = JSON.stringify(body);
  return sendHttpRequest(url, {
    cancellationToken,
    method: "PATCH",
    headers: {
      "authorization": `token ${githubToken}`,
      "content-length": Buffer.byteLength(bodyAsString)
    },
    body: bodyAsString,
    responseStatusMap: {
      200: async response => {
        const json = await response.json();
        return json;
      }
    }
  });
};

const sendHttpRequest = async (url, {
  cancellationToken,
  method,
  headers,
  body,
  responseStatusMap
}) => {
  let response;

  try {
    response = await fetchUrl(url, {
      cancellationToken,
      method,
      headers,
      body
    });
  } catch (error) {
    throw new Error(`network error during request.
--- request method ---
${method}
--- request url ---
${url}
--- error stack ---
${error.stack}`);
  }

  const {
    status
  } = response;

  if (status in responseStatusMap) {
    return responseStatusMap[response.status](response);
  }

  const responseBodyAsJson = await response.json();
  const error = new Error(`unexpected response status.
--- expected response status ---
${Object.keys(responseStatusMap).join(", ")}
--- response status ---
${response.status}
--- request method ---
${method}
--- request url ---
${url}
--- response json ---
${(JSON.stringify(responseBodyAsJson), "  ")}`);
  error.responseStatus = status;
  throw error;
};

const getGist = (gistId, options) => getGithubRessource(`https://api.github.com/gists/${gistId}`, options); // https://developer.github.com/v3/gists/#create-a-gist
// if status is 404 make sure your token got the rights
// to create gists

const postGist = ({
  files = {},
  description,
  secret = false
}, options) => postGithubRessource(`https://api.github.com/gists`, {
  files,
  description,
  public: !secret
}, options);
const patchGist = (gistId, gist, options) => patchGithubRessource(`https://api.github.com/gists/${gistId}`, gist, options);

const getPullRequest = ({
  repositoryOwner,
  repositoryName,
  pullRequestNumber
}, options) => getGithubRessource(`https://api.github.com/repos/${repositoryOwner}/${repositoryName}/pulls/${pullRequestNumber}`, options);
const getPullRequestCommentMatching = async (predicate, {
  repositoryOwner,
  repositoryName,
  pullRequestNumber
}, options) => {
  const comments = await getGithubRessource(`https://api.github.com/repos/${repositoryOwner}/${repositoryName}/issues/${pullRequestNumber}/comments`, options);
  return comments.find(predicate);
};
const postPullRequestComment = (commentBody, {
  repositoryOwner,
  repositoryName,
  pullRequestNumber
}, options) => {
  return postGithubRessource(`https://api.github.com/repos/${repositoryOwner}/${repositoryName}/issues/${pullRequestNumber}/comments`, {
    body: commentBody
  }, options);
};
const patchPullRequestComment = (commentId, commentBody, {
  repositoryOwner,
  repositoryName,
  pullRequestNumber
}, options) => {
  return patchGithubRessource(`https://api.github.com/repos/${repositoryOwner}/${repositoryName}/issues/${pullRequestNumber}/comments`, {
    body: commentBody
  }, options);
};

const enDecimalFormatter = new Intl.NumberFormat("en", {
  style: "decimal"
});
const formatNumericDiff = valueAsNumber => {
  const valueAsAbsoluteNumber = Math.abs(valueAsNumber);
  const valueAsString = enDecimalFormatter.format(valueAsAbsoluteNumber);

  if (valueAsNumber < 0) {
    return `-${valueAsString}`;
  }

  if (valueAsNumber > 0) {
    return `+${valueAsString}`;
  }

  return valueAsString;
};

/*

*/
const generateCommentBody = ({
  headerMessages = [],
  baseReport,
  headReport,
  baseGist,
  headGist,
  pullRequestBase,
  pullRequestHead
}) => {
  const baseVersion = baseReport.lighthouseVersion;
  const headVersion = headReport.lighthouseVersion;
  let impactAnalysisEnabled = true;

  if (baseVersion !== headVersion) {
    impactAnalysisEnabled = false;
    headerMessages.push(`**Warning:** Impact analysis skipped because lighthouse version are different on \`${pullRequestBase}\` (${baseVersion}) and \`${pullRequestHead}\` (${headVersion}).`);
  }

  return `<!-- Generated by @jsenv/github-pull-request-lighthouse-impact -->
${baseGist ? `<!-- base-gist-id=${baseGist.id} -->` : ``}
${headGist ? `<!-- head-gist-id=${headGist.id} -->` : ``}
<h2>Lighthouse merge impact</h2>

${renderHeader(headerMessages)}
${impactAnalysisEnabled ? renderBody({
    baseReport,
    headReport,
    pullRequestBase,
    pullRequestHead
  }) : ""}
${renderFooter({
    baseGist,
    headGist,
    pullRequestBase,
    pullRequestHead
  })}`;
};

const renderHeader = headerMessages => {
  if (headerMessages.length === 0) {
    return "";
  }

  return `---

${headerMessages.join(`

`)}

---`;
};

const renderBody = ({
  baseReport,
  headReport,
  pullRequestBase,
  pullRequestHead
}) => {
  return Object.keys(baseReport.categories).map(categoryName => {
    return renderCategory(categoryName, {
      baseReport,
      headReport,
      pullRequestBase,
      pullRequestHead
    });
  }).join(`

`);
};

const renderCategory = (category, {
  baseReport,
  headReport,
  pullRequestBase,
  pullRequestHead
}) => {
  const baseScore = scoreToDisplayedScore(baseReport.categories[category].score);
  const headScore = scoreToDisplayedScore(headReport.categories[category].score);
  const diffScore = formatNumericDiff(headScore - baseScore);
  return `<details>
  <summary>${category} (${diffScore})</summary>
  ${renderCategoryScore(category, {
    baseReport,
    headReport,
    pullRequestBase,
    pullRequestHead
  })}
  ${renderCategoryAudits(category, {
    baseReport,
    headReport,
    pullRequestBase,
    pullRequestHead
  })}
</details>`;
};

const scoreToDisplayedScore = score => twoDecimalsPrecision(score);

const twoDecimalsPrecision = floatingNumber => Math.round(floatingNumber * 100) / 100;

const renderCategoryScore = (category, {
  baseReport,
  headReport,
  pullRequestBase,
  pullRequestHead
}) => {
  const headerCells = [`<th nowrap>Impact</th>`, `<th nowrap>${pullRequestBase}</th>`, `<th nowrap>${pullRequestHead}</th>`];
  const baseScore = scoreToDisplayedScore(baseReport.categories[category].score);
  const headScore = scoreToDisplayedScore(headReport.categories[category].score);
  const bodyCells = [`<td nowrap>${formatNumericDiff(headScore - baseScore)}</td>`, `<td nowrap>${baseScore}</td>`, `<td nowrap>${headScore}</td>`];
  return `<h3>Global impact on ${category}</h3>
  <table>
    <thead>
      <tr>
        ${headerCells.join(`
        `)}
      </tr>
    </thead>
    <tbody>
      <tr>
        ${bodyCells.join(`
        `)}
      </tr>
    </tbody>
  </table>`;
};

const renderCategoryAudits = (category, {
  baseReport,
  headReport,
  pullRequestBase,
  pullRequestHead
}) => {
  const impactedAuditsHeaderCells = [`<th nowrap>Audit</th>`, `<th nowrap>Impact</th>`, `<th nowrap>${pullRequestBase}</th>`, `<th nowrap>${pullRequestHead}</th>`];
  const {
    auditRefs
  } = baseReport.categories[category];
  const impactedAudits = [];
  auditRefs.forEach(auditRef => {
    const auditId = auditRef.id;
    const baseAudit = baseReport.audits[auditId];
    const headAudit = headReport.audits[auditId];
    const {
      scoreDisplayMode
    } = baseAudit; // manual checks cannot be compared
    // and there is definitely no use to display them

    if (scoreDisplayMode === "manual") {
      return;
    } // informative audit will mostly be skipped


    if (scoreDisplayMode === "informative") {
      const baseNumericValue = baseAudit.numericValue;
      const baseDisplayValue = baseAudit.displayValue;
      const headNumericValue = headAudit.numericValue;
      const headDisplayValue = headAudit.displayValue;

      if (typeof baseNumericValue !== "undefined") {
        impactedAudits.push([`<td nowrap>${auditId}</td>`, `<td nowrap>${baseNumericValue === headNumericValue ? "none" : "---"}</td>`, `<td nowrap>${typeof baseDisplayValue === "undefined" ? baseNumericValue : baseDisplayValue}</td>`, `<td nowrap>${typeof headDisplayValue === "undefined" ? headNumericValue : headDisplayValue}</td>`]);
        return;
      }

      if (typeof baseDisplayValue !== "undefined") {
        impactedAudits.push([`<td nowrap>${auditId}</td>`, `<td nowrap>${baseDisplayValue === headDisplayValue ? "none" : "---"}</td>`, `<td nowrap>${baseDisplayValue}</td>`, `<td nowrap>${headDisplayValue}</td>`]);
        return;
      }

      return;
    }

    if (scoreDisplayMode === "binary") {
      const baseScore = baseAudit.score;
      const headScore = headAudit.score;

      if (baseScore === headScore) {
        impactedAudits.push([`<td nowrap>${auditId}</td>`, `<td nowrap>none</td>`, `<td nowrap>${baseScore ? "✔" : "☓"}</td>`, `<td nowrap>${baseScore ? "✔" : "☓"}</td>`]);
        return;
      }

      impactedAudits.push([`<td nowrap>${auditId}</td>`, `<td nowrap>✔</td>`, `<td nowrap>☓</td>`, `<td nowrap>✔</td>`]);
      return;
    }

    if (scoreDisplayMode === "numeric") {
      const baseScore = baseAudit.score;
      const headScore = headAudit.score;

      if (baseScore === headScore) {
        impactedAudits.push([`<td nowrap>${auditId}</td>`, `<td nowrap>none</td>`, `<td nowrap>${baseScore}</td>`, `<td nowrap>${headScore}</td>`]);
        return;
      }

      impactedAudits.push([`<td nowrap>${auditId}</td>`, `<td nowrap>${formatNumericDiff(headScore - baseScore)}</td>`, `<td nowrap>${baseScore}</td>`, `<td nowrap>${headScore}</td>`]);
      return;
    }

    impactedAudits.push([`<td nowrap>${auditId}</td>`, `<td nowrap>---</td>`, `<td nowrap>---</td>`, `<td nowrap>---</td>`]);
  });
  return `<h3>Detailed impact on ${category}</h3>
  <table>
    <thead>
      <tr>
        ${impactedAuditsHeaderCells.join(`
        `)}
      </tr>
    </thead>
    <tbody>
      <tr>${impactedAudits.map(cells => `
        ${cells.join(`
        `)}`).join(`
      </tr>
      <tr>`)}
      </tr>
    </tbody>
  </table>`;
};

const renderFooter = ({
  baseGist,
  headGist,
  pullRequestBase
}) => {
  return `${baseGist ? `<sub>
  Impact analyzed comparing <a href="${gistIdToReportUrl(baseGist.id)}">${pullRequestBase} report</a> and <a href="${gistIdToReportUrl(headGist.id)}">report after merge</a>
</sub>
<br />` : ``}
<sub>
  Generated by <a href="https://github.com/jsenv/jsenv-lighthouse-score-merge-impact">lighthouse score merge impact</a>
</sub>`;
};

const gistIdToReportUrl = gistId => {
  return `https://googlechrome.github.io/lighthouse/viewer/?gist=${gistId}`;
};

/* eslint-disable import/max-dependencies */
const reportLighthouseScoreMergeImpact = async (generateLighthouseReport, {
  cancellationToken = createCancellationTokenForProcess(),
  logLevel,
  projectDirectoryUrl,
  githubToken,
  repositoryOwner,
  repositoryName,
  pullRequestNumber
}) => {
  return wrapExternalFunction(async () => {
    projectDirectoryUrl = assertAndNormalizeDirectoryUrl(projectDirectoryUrl);

    if (typeof githubToken !== "string") {
      throw new TypeError(`githubToken must be a string but received ${githubToken}`);
    }

    if (typeof repositoryOwner !== "string") {
      throw new TypeError(`repositoryOwner must be a string but received ${repositoryOwner}`);
    }

    if (typeof repositoryName !== "string") {
      throw new TypeError(`repositoryName must be a string but received ${repositoryName}`);
    }

    pullRequestNumber = String(pullRequestNumber);

    if (typeof pullRequestNumber !== "string") {
      throw new TypeError(`pullRequestNumber must be a string but received ${pullRequestNumber}`);
    }

    const logger = createLogger({
      logLevel
    });

    const execCommandInProjectDirectory = command => exec(command, {
      cwd: projectDirectoryUrl
    });

    const pullRequest = await getPullRequest({
      repositoryOwner,
      repositoryName,
      pullRequestNumber
    }, {
      cancellationToken
    }); // here we could detect fork and so on

    const pullRequestBase = pullRequest.base.ref;
    const pullRequestHead = pullRequest.head.ref;
    logger.debug(`searching lighthouse comment in pull request ${getPullRequestUrl({
      repositoryOwner,
      repositoryName,
      pullRequestNumber
    })}`);
    const existingComment = await createOperation({
      cancellationToken,
      start: () => getPullRequestCommentMatching(({
        body
      }) => body.match(/<!-- Generated by @jsenv\/github-pull-request-lighthouse-impact -->/), {
        githubToken,
        repositoryOwner,
        repositoryName,
        pullRequestNumber
      })
    });

    if (existingComment) {
      logger.debug(`comment found at ${commentToUrl(existingComment)}.`);
    } else {
      logger.debug(`comment not found`);
    }

    const patchOrPostComment = async commentBody => {
      if (existingComment) {
        logger.debug(`updating comment at ${commentToUrl(existingComment)}`);
        const comment = await patchPullRequestComment(existingComment.id, commentBody, {
          repositoryOwner,
          repositoryName,
          pullRequestNumber
        }, {
          githubToken
        });
        logger.log("comment updated");
        return comment;
      }

      logger.debug(`creating comment`);
      const comment = await postPullRequestComment(commentBody, {
        repositoryOwner,
        repositoryName,
        pullRequestNumber
      }, {
        githubToken
      });
      logger.debug(`comment created at ${commentToUrl(comment)}`);
      return comment;
    };

    let baseReport;

    try {
      await execCommandInProjectDirectory(`git fetch --no-tags --prune --depth=1 origin ${pullRequestBase}`);
      await execCommandInProjectDirectory(`git checkout origin/${pullRequestBase}`);
      await execCommandInProjectDirectory(`npm install`);
      baseReport = await generateLighthouseReport();
    } catch (error) {
      logger.error(error.stack);
      const comment = await patchOrPostComment(`<!-- Generated by @jsenv/github-pull-request-lighthouse-impact -->

<h2>Lighthouse merge impact</h2>

---

**Error:** Error while trying to generate a report for ${pullRequestBase}.

<pre>${error.stack}</pre>

---`);
      return {
        error,
        comment
      };
    }

    let headReport;

    try {
      await execCommandInProjectDirectory(`git fetch --no-tags --prune origin ${pullRequestHead}`);
      await execCommandInProjectDirectory(`git merge FETCH_HEAD`);
      await execCommandInProjectDirectory(`npm install`);
      headReport = await generateLighthouseReport();
    } catch (error) {
      logger.error(error.stack);
      const comment = await patchOrPostComment(`<!-- Generated by @jsenv/github-pull-request-lighthouse-impact -->

<h2>Lighthouse merge impact</h2>

---

**Error:** Error while trying to generate a report for ${pullRequestHead} merge into ${pullRequestBase}.

<pre>${error.stack}</pre>

---`);
      return {
        error,
        comment
      };
    }

    const patchOrPostGists = async () => {
      let baseGistId;
      let headGistId;

      if (existingComment) {
        const gistIds = commentToGistIds(existingComment);

        if (gistIds) {
          baseGistId = gistIds.baseGistId;
          headGistId = gistIds.headGistId;
          logger.debug(`gists found in comment body
--- gist for base lighthouse report ---
${gistIdToUrl(baseGistId)}
--- gist for head lighthouse report ---
${gistIdToUrl(headGistId)}`);
        } else {
          logger.debug(`cannot find gist id in comment body
--- comment body ---
${existingComment.body}`);
        }
      }

      logger.debug(`update or create both gists.`);
      let [baseGist, headGist] = await Promise.all([baseGistId ? getGist(baseGistId, {
        cancellationToken,
        githubToken
      }) : null, headGistId ? getGist(headGistId, {
        cancellationToken,
        githubToken
      }) : null]);
      const baseGistData = {
        files: {
          [`${repositoryOwner}-${repositoryName}-pr-${pullRequestNumber}-base-lighthouse-report.json`]: {
            content: JSON.stringify(baseReport)
          }
        }
      };
      const headGistData = {
        files: {
          [`${repositoryOwner}-${repositoryName}-pr-${pullRequestNumber}-merged-lighthouse-report.json`]: {
            content: JSON.stringify(headReport)
          }
        }
      };

      if (baseGist) {
        logger.debug("base gist found, updating it");
        baseGist = await patchGist(baseGist.id, baseGistData, {
          cancellationToken,
          githubToken
        });
      } else {
        logger.debug(`base gist not found, creating it`);
        baseGist = await postGist(baseGistData, {
          cancellationToken,
          githubToken
        });
      }

      if (headGist) {
        logger.debug("head gist found, updating it");
        headGist = await patchGist(headGist.id, headGistData, {
          cancellationToken,
          githubToken
        });
      } else {
        logger.debug(`head gist not found, creating it`);
        headGist = await postGist(headGistData, {
          cancellationToken,
          githubToken
        });
      }

      return {
        baseGist,
        headGist
      };
    };

    let baseGist;
    let headGist;
    const headerMessages = [];

    try {
      const gists = await patchOrPostGists();
      baseGist = gists.baseGist;
      headGist = gists.headGist;
    } catch (e) {
      if (e.responseStatus === 401) {
        headerMessages.push(`**Warning:** Link to lighthouse reports cannot be generated because github token is not allowed to create gists.`);
      } else {
        throw e;
      }
    }

    const comment = await patchOrPostComment(generateCommentBody({
      headerMessages,
      baseReport,
      headReport,
      baseGist,
      headGist,
      pullRequestBase,
      pullRequestHead
    }));
    return {
      baseGist,
      headGist,
      comment
    };
  }, {
    catchCancellation: true,
    unhandledRejectionStrict: true
  });
};
const baseGistIdRegex = new RegExp("<!-- base-gist-id=([a-zA-Z0-9_]+) -->");
const headGistIdRegex = new RegExp("<!-- head-gist-id=([a-zA-Z0-9_]+) -->");

const commentToGistIds = comment => {
  const baseGistId = comment.body.match(baseGistIdRegex)[1];
  if (!baseGistId) return null;
  const headGistId = comment.body.match(headGistIdRegex)[1];
  if (!headGistId) return null;
  return {
    baseGistId,
    headGistId
  };
};

const commentToUrl = comment => {
  return comment.html_url;
};

const gistIdToUrl = gistId => {
  return `https://gist.github.com/${gistId}`;
};

const getPullRequestUrl = ({
  repositoryOwner,
  repositoryName,
  pullRequestNumber
}) => `https://github.com/${repositoryOwner}/${repositoryName}/pull/${pullRequestNumber}`;

const require$3 = module$1.createRequire(url);

const {
  getInput
} = require$3("@actions/core");

const run = async () => {
  const eventName = process.env.GITHUB_EVENT_NAME;

  if (!eventName) {
    throw new Error(`missing process.env.GITHUB_EVENT_NAME, we are not in a github workflow`);
  }

  if (eventName !== "pull_request") {
    throw new Error(`must be called only in a pull request`);
  }

  const githubToken = getInput("github-token") || process.env.GITHUB_TOKEN;
  const logLevel = getInput("log-level");
  const command = getInput("command");
  const outFilePath = getInput("command-outfile-path");
  const projectDirectoryUrl = process.cwd();
  const logger = createLogger({
    logLevel
  });

  if (!githubToken) {
    throw new Error(`missing githubToken`);
  }

  const githubRepository = process.env.GITHUB_REPOSITORY;

  if (!githubRepository) {
    throw new Error(`missing process.env.GITHUB_REPOSITORY`);
  }

  const [repositoryOwner, repositoryName] = githubRepository.split("/");
  const pullRequestNumber = await readPullRequestNumber({
    logger
  });
  return reportLighthouseScoreMergeImpact(async () => {
    await exec(command);
    const outFileUrl = resolveUrl(outFilePath, projectDirectoryUrl);
    const outFileContent = await readFile(outFileUrl);
    return JSON.parse(outFileContent);
  }, {
    logLevel,
    projectDirectoryUrl,
    githubToken,
    repositoryOwner,
    repositoryName,
    pullRequestNumber
  });
};

const readPullRequestNumber = async ({
  logger
}) => {
  const githubRef = process.env.GITHUB_REF;

  if (!githubRef) {
    throw new Error(`missing process.env.GITHUB_REF`);
  }

  const pullRequestNumber = githubRefToPullRequestNumber(githubRef);
  if (pullRequestNumber) return pullRequestNumber; // https://github.com/actions/checkout/issues/58#issuecomment-589447479

  const githubEventFilePath = process.env.GITHUB_EVENT_PATH;

  if (githubEventFilePath) {
    logger.warn(`pull request number not found in process.env.GITHUB_REF, trying inside github event file.
--- process.env.GITHUB_REF ---
${githubRef}
--- github event file path ---
${githubEventFilePath}
`);
    const githubEventFileContent = await readFile(githubEventFilePath);
    const githubEvent = JSON.parse(githubEventFileContent);
    const pullRequestNumber = githubEvent.pull_request.number;
    logger.warn(`pull request number found in the file: ${pullRequestNumber}`);

    if (pullRequestNumber) {
      return pullRequestNumber;
    }
  }

  throw new Error(`cannot get pull request number from process.env.GITHUB_REF
--- process.env.GITHUB_REF ---
${githubRef}`);
};

const githubRefToPullRequestNumber = githubRef => {
  const pullPrefix = "refs/pull/";
  const pullRequestNumberStartIndex = githubRef.indexOf(pullPrefix);
  if (pullRequestNumberStartIndex === -1) return undefined;
  const afterPull = githubRef.slice(pullRequestNumberStartIndex + pullPrefix.length);
  const slashAfterPullIndex = afterPull.indexOf("/");
  if (slashAfterPullIndex === -1) return undefined;
  const pullRequestNumberString = afterPull.slice(0, slashAfterPullIndex);
  return Number(pullRequestNumberString);
};

var action = run();

module.exports = action;
//# sourceMappingURL=action.cjs.map
