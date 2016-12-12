/*
   Copyright 2016 The Trustees of University of Arizona

   Licensed under the Apache License, Version 2.0 (the "License" );
   you may not use this file except in compliance with the License.
   You may obtain a copy of the License at

       http://www.apache.org/licenses/LICENSE-2.0

   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.
*/

var syndicateerr = require('./errors.js');

/**
 * POSIX ERROR CODES
 */
var ERROR_CODE_TABLE = [
    {
    code: "EPERM",
    errno: 1,
    description: "Operation not permitted"
    },
    {
    code: "ENOENT",
    errno: 2,
    description: "No such file or directory"
    },
    {
    code: "ESRCH",
    errno: 3,
    description: "No such process"
    },
    {
    code: "EINTR",
    errno: 4,
    description: "Interrupted system call"
    },
    {
    code: "EIO",
    errno: 5,
    description: "I/O error"
    },
    {
    code: "ENXIO",
    errno: 6,
    description: "No such device or address"
    },
    {
    code: "E2BIG",
    errno: 7,
    description: "Argument list too long"
    },
    {
    code: "ENOEXEC",
    errno: 8,
    description: "Exec format error"
    },
    {
    code: "EBADF",
    errno: 9,
    description: "Bad file number"
    },
    {
    code: "ECHILD",
    errno: 10,
    description: "No child processes"
    },
    {
    code: "EAGAIN",
    errno: 11,
    description: "Try again"
    },
    {
    code: "ENOMEM",
    errno: 12,
    description: "Out of memory"
    },
    {
    code: "EACCES",
    errno: 13,
    description: "Permission denied"
    },
    {
    code: "EFAULT",
    errno: 14,
    description: "Bad address"
    },
    {
    code: "ENOTBLK",
    errno: 15,
    description: "Block device required"
    },
    {
    code: "EBUSY",
    errno: 16,
    description: "Device or resource busy"
    },
    {
    code: "EEXIST",
    errno: 17,
    description: "File exists"
    },
    {
    code: "EXDEV",
    errno: 18,
    description: "Cross-device link"
    },
    {
    code: "ENODEV",
    errno: 19,
    description: "No such device"
    },
    {
    code: "ENOTDIR",
    errno: 20,
    description: "Not a directory"
    },
    {
    code: "EISDIR",
    errno: 21,
    description: "Is a directory"
    },
    {
    code: "EINVAL",
    errno: 22,
    description: "Invalid argument"
    },
    {
    code: "ENFILE",
    errno: 23,
    description: "File table overflow"
    },
    {
    code: "EMFILE",
    errno: 24,
    description: "Too many open files"
    },
    {
    code: "ENOTTY",
    errno: 25,
    description: "Not a typewriter"
    },
    {
    code: "ETXTBSY",
    errno: 26,
    description: "Text file busy"
    },
    {
    code: "EFBIG",
    errno: 27,
    description: "File too large"
    },
    {
    code: "ENOSPC",
    errno: 28,
    description: "No space left on device"
    },
    {
    code: "ESPIPE",
    errno: 29,
    description: "Illegal seek"
    },
    {
    code: "EROFS",
    errno: 30,
    description: "Read-only file system"
    },
    {
    code: "EMLINK",
    errno: 31,
    description: "Too many links"
    },
    {
    code: "EPIPE",
    errno: 32,
    description: "Broken pipe"
    },
    {
    code: "EDOM",
    errno: 33,
    description: "Math argument out of domain of func"
    },
    {
    code: "ERANGE",
    errno: 34,
    description: "Math result not representable"
    },
    {
    code: "EDEADLK",
    errno: 35,
    description: "Resource deadlock would occur"
    },
    {
    code: "ENAMETOOLONG",
    errno: 36,
    description: "File name too long"
    },
    {
    code: "ENOLCK",
    errno: 37,
    description: "No record locks available"
    },
    {
    code: "ENOSYS",
    errno: 38,
    description: "Function not implemented"
    },
    {
    code: "ENOTEMPTY",
    errno: 39,
    description: "Directory not empty"
    },
    {
    code: "ELOOP",
    errno: 40,
    description: "Too many symbolic links encountered"
    },
    {
    code: "ENOMSG",
    errno: 42,
    description: "No message of desired type"
    },
    {
    code: "EIDRM",
    errno: 43,
    description: "Identifier removed"
    },
    {
    code: "ECHRNG",
    errno: 44,
    description: "Channel number out of range"
    },
    {
    code: "EL2NSYNC",
    errno: 45,
    description: "Level 2 not synchronized"
    },
    {
    code: "EL3HLT",
    errno: 46,
    description: "Level 3 halted"
    },
    {
    code: "EL3RST",
    errno: 47,
    description: "Level 3 reset"
    },
    {
    code: "ELNRNG",
    errno: 48,
    description: "Link number out of range"
    },
    {
    code: "EUNATCH",
    errno: 49,
    description: "Protocol driver not attached"
    },
    {
    code: "ENOCSI",
    errno: 50,
    description: "No CSI structure available"
    },
    {
    code: "EL2HLT",
    errno: 51,
    description: "Level 2 halted"
    },
    {
    code: "EBADE",
    errno: 52,
    description: "Invalid exchange"
    },
    {
    code: "EBADR",
    errno: 53,
    description: "Invalid request descriptor"
    },
    {
    code: "EXFULL",
    errno: 54,
    description: "Exchange full"
    },
    {
    code: "ENOANO",
    errno: 55,
    description: "No anode"
    },
    {
    code: "EBADRQC",
    errno: 56,
    description: "Invalid request code"
    },
    {
    code: "EBADSLT",
    errno: 57,
    description: "Invalid slot"
    },
    {
    code: "EBFONT",
    errno: 59,
    description: "Bad font file format"
    },
    {
    code: "ENOSTR",
    errno: 60,
    description: "Device not a stream"
    },
    {
    code: "ENODATA",
    errno: 61,
    description: "No data available"
    },
    {
    code: "ETIME",
    errno: 62,
    description: "Timer expired"
    },
    {
    code: "ENOSR",
    errno: 63,
    description: "Out of streams resources"
    },
    {
    code: "ENONET",
    errno: 64,
    description: "Machine is not on the network"
    },
    {
    code: "ENOPKG",
    errno: 65,
    description: "Package not installed"
    },
    {
    code: "EREMOTE",
    errno: 66,
    description: "Object is remote"
    },
    {
    code: "ENOLINK",
    errno: 67,
    description: "Link has been severed"
    },
    {
    code: "EADV",
    errno: 68,
    description: "Advertise error"
    },
    {
    code: "ESRMNT",
    errno: 69,
    description: "Srmount error"
    },
    {
    code: "ECOMM",
    errno: 70,
    description: "Communication error on send"
    },
    {
    code: "EPROTO",
    errno: 71,
    description: "Protocol error"
    },
    {
    code: "EMULTIHOP",
    errno: 72,
    description: "Multihop attempted"
    },
    {
    code: "EDOTDOT",
    errno: 73,
    description: "RFS specific error"
    },
    {
    code: "EBADMSG",
    errno: 74,
    description: "Not a data message"
    },
    {
    code: "EOVERFLOW",
    errno: 75,
    description: "Value too large for defined data type"
    },
    {
    code: "ENOTUNIQ",
    errno: 76,
    description: "Name not unique on network"
    },
    {
    code: "EBADFD",
    errno: 77,
    description: "File descriptor in bad state"
    },
    {
    code: "EREMCHG",
    errno: 78,
    description: "Remote address changed"
    },
    {
    code: "ELIBACC",
    errno: 79,
    description: "Can not access a needed shared library"
    },
    {
    code: "ELIBBAD",
    errno: 80,
    description: "Accessing a corrupted shared library"
    },
    {
    code: "ELIBSCN",
    errno: 81,
    description: ".lib section in a.out corrupted"
    },
    {
    code: "ELIBMAX",
    errno: 82,
    description: "Attempting to link in too many shared libraries"
    },
    {
    code: "ELIBEXEC",
    errno: 83,
    description: "Cannot exec a shared library directly"
    },
    {
    code: "EILSEQ",
    errno: 84,
    description: "Illegal byte sequence"
    },
    {
    code: "ERESTART",
    errno: 85,
    description: "Interrupted system call should be restarted"
    },
    {
    code: "ESTRPIPE",
    errno: 86,
    description: "Streams pipe error"
    },
    {
    code: "EUSERS",
    errno: 87,
    description: "Too many users"
    },
    {
    code: "ENOTSOCK",
    errno: 88,
    description: "Socket operation on non-socket"
    },
    {
    code: "EDESTADDRREQ",
    errno: 89,
    description: "Destination address required"
    },
    {
    code: "EMSGSIZE",
    errno: 90,
    description: "Message too long"
    },
    {
    code: "EPROTOTYPE",
    errno: 91,
    description: "Protocol wrong type for socket"
    },
    {
    code: "ENOPROTOOPT",
    errno: 92,
    description: "Protocol not available"
    },
    {
    code: "EPROTONOSUPPORT",
    errno: 93,
    description: "Protocol not supported"
    },
    {
    code: "ESOCKTNOSUPPORT",
    errno:  94,
    description: "Socket type not supported"
    },
    {
    code: "EOPNOTSUPP",
    errno: 95,
    description: "Operation not supported on transport endpoint"
    },
    {
    code: "EPFNOSUPPORT",
    errno: 96,
    description: "Protocol family not supported"
    },
    {
    code: "EAFNOSUPPORT",
    errno: 97,
    description: "Address family not supported by protocol"
    },
    {
    code: "EADDRINUSE",
    errno: 98,
    description: "Address already in use"
    },
    {
    code: "EADDRNOTAVAIL",
    errno: 99,
    description: "Cannot assign requested address"
    },
    {
    code: "ENETDOWN",
    errno: 100,
    description: "Network is down"
    },
    {
    code: "ENETUNREACH",
    errno: 101,
    description: "Network is unreachable"
    },
    {
    code: "ENETRESET",
    errno: 102,
    description: "Network dropped connection because of reset"
    },
    {
    code: "ECONNABORTED",
    errno: 103,
    description: "Software caused connection abort"
    },
    {
    code: "ECONNRESET",
    errno: 104,
    description: "Connection reset by peer"
    },
    {
    code: "ENOBUFS",
    errno: 105,
    description: "No buffer space available"
    },
    {
    code: "EISCONN",
    errno: 106,
    description: "Transport endpoint is already connected"
    },
    {
    code: "ENOTCONN",
    errno: 107,
    description: "Transport endpoint is not connected"
    },
    {
    code: "ESHUTDOWN",
    errno: 108,
    description: "Cannot send after transport endpoint shutdown"
    },
    {
    code: "ETOOMANYREFS",
    errno: 109,
    description: "Too many references: cannot splice"
    },
    {
    code: "ETIMEDOUT",
    errno: 110,
    description: "Connection timed out"
    },
    {
    code: "ECONNREFUSED",
    errno: 111,
    description: "Connection refused"
    },
    {
    code: "EHOSTDOWN",
    errno: 112,
    description: "Host is down"
    },
    {
    code: "EHOSTUNREACH",
    errno: 113,
    description: "No route to host"
    },
    {
    code: "EALREADY",
    errno: 114,
    description: "Operation already in progress"
    },
    {
    code: "EINPROGRESS",
    errno: 115,
    description: "Operation now in progress"
    },
    {
    code: "ESTALE",
    errno: 116,
    description: "Stale NFS file handle"
    },
    {
    code: "EUCLEAN",
    errno: 117,
    description: "Structure needs cleaning"
    },
    {
    code: "ENOTNAM",
    errno: 118,
    description: "Not a XENIX named type file"
    },
    {
    code: "ENAVAIL",
    errno: 119,
    description: "No XENIX semaphores available"
    },
    {
    code: "EISNAM",
    errno: 120,
    description: "Is a named type file"
    },
    {
    code: "EREMOTEIO",
    errno: 121,
    description: "Remote I/O error"
    },
    {
    code: "EDQUOT",
    errno: 122,
    description: "Quota exceeded"
    },
    {
    code: "ENOMEDIUM",
    errno: 123,
    description: "No medium found"
    },
    {
    code: "EMEDIUMTYPE",
    errno: 124,
    description: "Wrong medium type"
    },
    {
    code: "ECANCELED",
    errno: 125,
    description: "Operation Canceled"
    },
    {
    code: "ENOKEY",
    errno: 126,
    description: "Required key not available"
    },
    {
    code: "EKEYEXPIRED",
    errno: 127,
    description: "Key has expired"
    },
    {
    code: "EKEYREVOKED",
    errno: 128,
    description: "Key has been revoked"
    },
    {
    code: "EKEYREJECTED",
    errno: 129,
    description: "Key was rejected by service"
    },
    {
    code: "EOWNERDEAD",
    errno: 130,
    description: "Owner died"
    },
    {
    code: "ENOTRECOVERABLE",
    errno: 131,
    description: "State not recoverable"
    }
];

var ERRNO_TABLE = {}

ERROR_CODE_TABLE.forEach(function (err) {
    ERRNO_TABLE[err.errno] = err;
})

/**
 * Expose root class
 */
module.exports = {
    // get error string from posix error code
    strerror: function(error_code) {
        if( ERRNO_TABLE[error_code] ) {
            return ERRNO_TABLE[error_code].description;
        } else {
            return "UNKNOWN ERROR - " + error_code;
        }
    },
    create_error: function(message, error_code) {
        var msg = message + " > ";
        if( ERRNO_TABLE[error_code] ) {
            msg += ERRNO_TABLE[error_code].description;
        } else {
            msg += "UNKNOWN ERROR - " + error_code;
        }
        return new syndicateerr.SyndicateError(msg, error_code);
    }
};
