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

/*
 * This module provides a low-level binding to libsyndicate.so and libsyndicate-ug.so using node-ffi
 */

var ref = require('ref');
var ffi = require('ffi');
var Struct = require('ref-struct');
var Union = require('ref-union');
var ArrayType = require('ref-array');

// Premitive data types
var off_t = "int64";
var mode_t = "uint32";
var intPtr = ref.refType("int");
var int64Ptr = ref.refType("int64");
var uint64Ptr = ref.refType("uint64");
var uint64PtrPtr = ref.refType(uint64Ptr);
var size_tPtr = ref.refType("size_t");
var stringPtr = ref.refType("string");
var stringArr = ArrayType("string");
var voidPtr = ref.refType("void");
var fsblkcnt_t = "uint64";
var fsfilcnt_t = "uint64";
var blksize_t = "uint64";
var blkcnt_t = "uint64";
var dev_t = "uint64";
var ino_t = "uint64";
var nlink_t = "uint64";
var uid_t = "uint32";
var gid_t = "uint32";
var time_t = "uint64";

// C data types
var utimbuf = Struct({
    "actime": time_t,  // access time (unused on FAT filesystems)
    "modtime": time_t, // modification time
});
var utimbufPtr = ref.refType(utimbuf);

var statvfs = Struct({
    "f_bsize": "uint64", // Filesystem block size
    "f_frsize": "uint64", // Fragment size
    "f_blocks": fsblkcnt_t, // Size of fs in f_frsize units
    "f_bfree": fsblkcnt_t, // Number of free blocks
    "f_bavail": fsblkcnt_t, // Number of free blocks for unprivileged users
    "f_files": fsfilcnt_t, // Number of inodes
    "f_ffree": fsfilcnt_t, // Number of free inodes
    "f_favail": fsfilcnt_t, // Number of free inodes for unprivileged users
    "f_fsid": "uint64", // Filesystem ID
    "f_flag": "uint64", // Mount flags
    "f_namemax": "uint64", // Maximum filename length
    "unused": ArrayType("char", 24),
});
var statvfsPtr = ref.refType(statvfs);

var stat = Struct({
    "st_dev": dev_t, // ID of device containing file
    "st_ino": ino_t, // inode number
    "st_mode": mode_t, // protection
    "st_nlink": nlink_t, // number of hard links
    "st_uid": uid_t, // user ID of owner
    "st_gid": gid_t, // group ID of owner
    "st_rdev": dev_t, // device ID (if special file)
    "st_size": off_t, // total size, in bytes
    "st_blksize": blksize_t, // blocksize for file system I/O
    "st_blocks": blkcnt_t, // number of 512B blocks allocated
    "st_atime": time_t, // time of last access
    "st_mtime": time_t, // time of last modification
    "st_ctime": time_t, // time of last status change
});
var statPtr = ref.refType(stat);

var O_RDONLY = 0;
var O_WRONLY = 1;
var O_RDWR = 2;

// SG gateway
var SG_gatewayPtr = ref.refType("void");

// global UG state
var UG_state = Struct({
    "gateway": SG_gatewayPtr,              // reference to the gateway core (which, in turn, points to UG_state)

    "replica_gateway_ids": uint64Ptr,      // IDs of replica gateways to replicate data to

    "num_replica_gateway_ids": "size_t",

    //struct fskit_core* fs;               // filesystem core
    "fs": "pointer",

    //struct UG_vacuumer* vacuumer;        // vacuumer instance
    "vacuumer": "pointer",

    //pthread_rwlock_t lock;               // lock governing access to this structure
    "lock": "pointer",

    // fskit route handles
    "stat_rh": "int",
    "creat_rh": "int",
    "mkdir_rh": "int",
    "open_rh": "int",
    "read_rh": "int",
    "write_rh": "int",
    "trunc_rh": "int",
    "close_rh": "int",
    "sync_rh": "int",
    "detach_rh": "int",
    "rename_rh": "int",

    "running_thread": "bool",            // if true, we've set up and started a thread to run the main loop ourselves
    //pthread_t thread;                    // the main loop thread
    "thread": "pointer",

    //struct md_wq* wq;                    // workqueue for deferred operations (like blowing away dead inodes)
    "wq": "pointer",
    "cls": voidPtr                      // extra UG-implementation state
});
var UG_statePtr = ref.refType(UG_state);

var md_opts = Struct({
    //char* config_file;
    "config_file": "string",
    //char* username;
    "username": "string",
    //char* volume_name;
    "volume_name": "string",
    //char* ms_url;
    "ms_url": "string",
    //char* gateway_name;
    "gateway_name": "string",
    "debug_level": "int",
    "foreground": "bool",

    // not set by the parser
    "client": "bool",
    "ignore_driver": "bool", // if true, no attempt to load the driver will be made
    "gateway_type": "uint64",

    //char const* driver_exec_str;
    "driver_exec_str": "string",
    //char const** driver_roles;
    "driver_roles": stringArr,
    "num_driver_roles": "size_t"
});
var md_optsPtr = ref.refType(md_opts);

var fskit_file_handlePtr = ref.refType("void");
var fskit_dir_handlePtr = ref.refType("void");

var UG_handle_t_inner_ptr = Union({
  fh: fskit_file_handlePtr,
  dh: fskit_file_handlePtr
});

var UG_handle_t = Struct({
    "type": "int32",
    "offset": off_t,
    "handle":  UG_handle_t_inner_ptr
});
var UG_handle_tPtr = ref.refType(UG_handle_t);

var md_entry = Struct({
    "type": "int", // file or directory?
    "name": "string", // name of this entry
    "file_id": "uint64", // id of this file
    "ctime_sec": "int64", // creation time (seconds)
    "ctime_nsec": "int32", // creation time (nanoseconds)
    "mtime_sec": "int64", // last-modified time (seconds)
    "mtime_nsec": "int32", // last-modified time (nanoseconds)
    "manifest_mtime_sec": "int64", // manifest last-mod time (actual last-write time, regardless of utime) (seconds)
    "manifest_mtime_nsec": "int32", // manifest last-mod time (actual last-write time, regardless of utime) (nanoseconds)
    "write_nonce": "int64", // last-write nonce
    "xattr_nonce": "int64", // xattr write nonce
    "version": "int64", // file version
    "max_read_freshness": "int32", // how long is this entry fresh until it needs revalidation?
    "max_write_freshness": "int32", // how long can we delay publishing this entry?
    "owner": "uint64", // ID of the User that owns this File
    "coordinator": "uint64", // ID of the Gateway that coordinatates writes on this File
    "volume": "uint64", // ID of the Volume
    "mode": mode_t, // file permission bits
    "size": off_t, // size of the file
    "error": "int32", // error information with this md_entry
    "generation": "int64", // n, as in, the nth item to ever be created in the parent directory
    "num_children": "int64", // number of children this entry has (if it's a directory)
    "capacity": "int64", // maximum index number a child can have (i.e. used by listdir())
    "ent_sig": "string", // signature over this entry from the coordinator, as well as any ancillary data below
    "ent_sig_len": "size_t",

    // ancillary data: not always filled in
    "parent_id": "uint64", // id of this file's parent directory

    // putxattr, removexattr only (and only from the coordinator)
    "xattr_hash": "string" // hash over (volume ID, file ID, xattr_nonce, sorted(xattr name, xattr value))
});
var md_entryPtr = ref.refType(md_entry);
var md_entryPtrPtr = ref.refType(md_entryPtr);
var md_entryPtrPtrPtr = ref.refType(md_entryPtrPtr);

var MD_ENTRY_FILE = 1;
var MD_ENTRY_DIRECTORY = 2;

var UG_vacuum_contextPtr = ref.refType("void");
var UG_vacuum_contextPtrPtr = ref.refType(UG_vacuum_contextPtr);


// from node-ffi source code
function newLibrary (libfile, funcs, lib) {
    if (libfile && libfile.indexOf(ffi.LIB_EXT) === -1) {
        libfile += ffi.LIB_EXT
    }
    if (!lib) {
        lib = {}
    }
    var mode = ffi.DynamicLibrary.FLAGS.RTLD_NOW | ffi.DynamicLibrary.FLAGS.RTLD_GLOBAL;
    var dl = new ffi.DynamicLibrary(libfile || null, mode)
    Object.keys(funcs || {}).forEach(function (func) {
        var fptr = dl.get(func)
            , info = funcs[func]
        if (fptr.isNull()) {
            throw new Error('Library: "' + libfile
            + '" returned NULL function pointer for "' + func + '"')
        }
        var resultType = info[0]
            , paramTypes = info[1]
            , fopts = info[2]
            , abi = fopts && fopts.abi
            , async = fopts && fopts.async
            , varargs = fopts && fopts.varargs
        if (varargs) {
            lib[func] = ffi.VariadicForeignFunction(fptr, resultType, paramTypes, abi)
        } else {
            var ff = ffi.ForeignFunction(fptr, resultType, paramTypes, abi)
            lib[func] = async ? ff.async : ff
        }
    })
    return lib
}

var fskit = newLibrary('/usr/local/lib/libfskit');
var libsyndicate = newLibrary('/usr/local/lib/libsyndicate', {
    //////////////////////////////
    // FROM libsyndicate/libsyndicate.h
    //////////////////////////////
    "md_entry_to_string": ["int", [md_entryPtr, stringPtr]],
    //////////////////////////////
    // FROM libsyndicate/gateway.h
    //////////////////////////////
    "SG_gateway_id": ["uint64", [SG_gatewayPtr]],
    "SG_gateway_user_id": ["uint64", [SG_gatewayPtr]],
    "SG_gateway_first_arg_optind": ["int", [SG_gatewayPtr]],
});
var libsyndicate_ug = newLibrary('/usr/local/lib/libsyndicate-ug', {
    //////////////////////////////
    // FROM libsyndicate-ug/core.h
    //////////////////////////////
    "UG_state_list_replica_gateway_ids": ["int", [UG_statePtr, uint64PtrPtr, size_tPtr]],
    "UG_state_reload_replica_gateway_ids": ["int", [UG_statePtr]],
    "UG_RG_context_new": ["pointer", []], // returns struct UG_RG_context*
    //"UG_RG_context_init": ["int", [UG_statePtr, struct UG_RG_context* rctx]],
    //"UG_RG_context_free": ["int", [struct UG_RG_context* rctx]],
    //"UG_RG_context_RG_ids": [uint64Ptr, [struct UG_RG_context* rctx]],
    //"UG_RG_context_num_RGs": ["size_t", [struct UG_RG_context* rctx]],
    //"UG_RG_context_get_status": ["int", [struct UG_RG_context* rctx, "int"]],
    //"UG_RG_context_set_status": ["int", [struct UG_RG_context* rctx, "int", "int"]],
    //"UG_RG_send_all": ["int", [SG_gatewayPtr, struct UG_RG_context* rctx, SG_messages::Request* controlplane_request, struct SG_chunk* dataplane_request]],
    "UG_state_rlock": ["int", [UG_statePtr]],
    "UG_state_wlock": ["int", [UG_statePtr]],
    "UG_state_unlock": ["int", [UG_statePtr]],
    // core init and shutdown
    "UG_init": [UG_statePtr, ["int", stringArr]],
    "UG_init_ex": [UG_statePtr, ["int", stringArr, md_optsPtr, "pointer"]],
    "UG_start": ["int", [UG_statePtr]],
    "UG_main": ["int", [UG_statePtr]],
    "UG_shutdown": ["int", [UG_statePtr]],
    // getters
    "UG_state_gateway": [SG_gatewayPtr, [UG_statePtr]],
    "UG_state_fs": ["pointer", [UG_statePtr]], // returns struct fskit_core*
    "UG_state_vacuumer": ["pointer", [UG_statePtr]], // returns struct UG_vacuumer*
    "UG_state_owner_id": ["uint64", [UG_statePtr]],
    "UG_state_volume_id": ["uint64", [UG_statePtr]],
    "UG_state_wq": ["pointer", [UG_statePtr]], // returns struct md_wq*
    "UG_state_driver": ["pointer", [UG_statePtr]], // returns struct SG_driver*
    "UG_state_cls": [voidPtr, [UG_statePtr]], // returns void*
    "UG_state_stat_rh": ["int", [UG_statePtr]],
    "UG_state_creat_rh": ["int", [UG_statePtr]],
    "UG_state_mkdir_rh": ["int", [UG_statePtr]],
    "UG_state_open_rh": ["int", [UG_statePtr]],
    "UG_state_read_rh": ["int", [UG_statePtr]],
    "UG_state_write_rh": ["int", [UG_statePtr]],
    "UG_state_trunc_rh": ["int", [UG_statePtr]],
    "UG_state_close_rh": ["int", [UG_statePtr]],
    "UG_state_sync_rh": ["int", [UG_statePtr]],
    "UG_state_detach_rh": ["int", [UG_statePtr]],
    "UG_state_rename_rh": ["int", [UG_statePtr]],
    // setters
    "UG_state_set_cls": ["void", [UG_statePtr, "pointer"]],
    "UG_state_set_stat_rh": ["int", [UG_statePtr, "int"]],
    "UG_state_set_creat_rh": ["int", [UG_statePtr, "int"]],
    "UG_state_set_mkdir_rh": ["int", [UG_statePtr, "int"]],
    "UG_state_set_open_rh": ["int", [UG_statePtr, "int"]],
    "UG_state_set_read_rh": ["int", [UG_statePtr, "int"]],
    "UG_state_set_write_rh": ["int", [UG_statePtr, "int"]],
    "UG_state_set_trunc_rh": ["int", [UG_statePtr, "int"]],
    "UG_state_set_close_rh": ["int", [UG_statePtr, "int"]],
    "UG_state_set_sync_rh": ["int", [UG_statePtr, "int"]],
    "UG_state_set_detach_rh": ["int", [UG_statePtr, "int"]],
    "UG_state_set_rename_rh": ["int", [UG_statePtr, "int"]],
    //////////////////////////////
    // FROM libsyndicate-ug/client.h
    //////////////////////////////
    // high-level metadata API
    "UG_stat": ["int", [UG_statePtr, "string", statPtr]],
    "UG_stat_raw": ["int", [UG_statePtr, "string", md_entryPtr]],
    "UG_mkdir": ["int", [UG_statePtr, "string", mode_t]],
    "UG_unlink": ["int", [UG_statePtr, "string"]],
    "UG_rmdir": ["int", [UG_statePtr, "string"]],
    "UG_rename": ["int", [UG_statePtr, "string", "string"]],
    "UG_chmod": ["int", [UG_statePtr, "string", mode_t]],
    "UG_chown": ["int", [UG_statePtr, "string", "uint64"]],
    "UG_utime": ["int", [UG_statePtr, "string", utimbufPtr]],
    "UG_chcoord": ["int", [UG_statePtr, "string", uint64Ptr]],
    "UG_truncate": ["int", [UG_statePtr, "string", off_t]],
    "UG_access": ["int", [UG_statePtr, "string", "int"]],
    "UG_invalidate": ["int", [UG_statePtr, "string"]],
    "UG_refresh": ["int", [UG_statePtr, "string"]],
    // high-level file data API
    "UG_open": [UG_handle_tPtr, [UG_statePtr, "string", "int", intPtr]],
    "UG_create": [UG_handle_tPtr, [UG_statePtr, "string", mode_t, intPtr]],
    "UG_publish": [UG_handle_tPtr, [UG_statePtr, "string", md_entryPtr, intPtr]],
    "UG_read": ["int", [UG_statePtr, "string", "size_t", UG_handle_tPtr]],
    "UG_write": ["int", [UG_statePtr, "string", "size_t", UG_handle_tPtr]],
    "UG_getblockinfo": ["int", [UG_statePtr, "uint64", int64Ptr, "string", UG_handle_tPtr]],
    "UG_putblockinfo": ["int", [UG_statePtr, "uint64", "uint64", "string", UG_handle_tPtr]],
    "UG_seek": [off_t, [UG_handle_tPtr, off_t, "int"]],
    "UG_close": ["int", [UG_statePtr, UG_handle_tPtr]],
    "UG_fsync": ["int", [UG_statePtr, UG_handle_tPtr]],
    "UG_ftruncate": ["int", [UG_statePtr, off_t, UG_handle_tPtr]],
    "UG_fstat": ["int", [UG_statePtr, statPtr, UG_handle_tPtr]],
    "UG_statvfs": ["int", [UG_statePtr, statvfsPtr]],
    // low-level file data API
    "UG_vacuum_begin": ["int", [UG_statePtr, "string", UG_vacuum_contextPtrPtr]],
    "UG_vacuum_wait": ["int", [UG_vacuum_contextPtr]],
    // high-level directory data API
    "UG_opendir": [UG_handle_tPtr, [UG_statePtr, "string", intPtr]],
    "UG_readdir": ["int", [UG_statePtr, md_entryPtrPtrPtr, "size_t", UG_handle_tPtr]],
    "UG_rewinddir": ["int", [UG_handle_tPtr]],
    "UG_telldir": [off_t, [UG_handle_tPtr]],
    "UG_seekdir": ["int", [UG_handle_tPtr, off_t]],
    "UG_closedir": ["int", [UG_statePtr, UG_handle_tPtr]],
    "UG_free_dir_listing": ["void", [md_entryPtrPtr]],
    // high-level xattr API
    "UG_setxattr": ["int", [UG_statePtr, "string", "string", "string", "size_t", "int"]],
    "UG_getxattr": ["int", [UG_statePtr, "string", "string", "string", "size_t"]],
    "UG_listxattr": ["int", [UG_statePtr, "string", "string", "size_t"]],
    "UG_removexattr": ["int", [UG_statePtr, "string", "string"]],
    //////////////////////////////
    // FROM libsyndicate-ug/consistency.h
    //////////////////////////////
    // go fetch an inode directoy from the MS
    "UG_consistency_inode_download": ["int", [SG_gatewayPtr, "uint64", md_entryPtr]],
    // get the manifest from one of a list of gateways
    //int UG_consistency_manifest_download( struct SG_gateway* gateway, struct SG_request_data* reqdat, uint64_t coordinator_id, uint64_t* gateway_ids, size_t num_gateway_ids, struct SG_manifest* manifest );
    // reload the path's-worth of metadata
    "UG_consistency_path_ensure_fresh": ["int", [SG_gatewayPtr, "string"]],
    // reload a directory's children
    "UG_consistency_dir_ensure_fresh": ["int", [SG_gatewayPtr, "string"]],
    // reload an inode's manifest
    "UG_consistency_manifest_ensure_fresh": ["int", [SG_gatewayPtr, "string"]],
    // fetch the xattrs for an inode
    //int UG_consistency_fetchxattrs( struct SG_gateway* gateway, uint64_t file_id, int64_t xattr_nonce, unsigned char* xattr_hash, fskit_xattr_set** ret_xattrs );
    // ensure a locally-cached inode is fresh
    //int UG_consistency_inode_ensure_fresh( struct SG_gateway* gateway, char const* fs_path, struct UG_inode* inode );
    // ask a remote gateway to refresh its inode
    "UG_consistency_request_refresh": ["int", [SG_gatewayPtr, "string"]],
});

/**
 * Expose the module
 */
module.exports = {
    libsyndicate: libsyndicate,
    libsyndicate_ug: libsyndicate_ug,
    helpers: {
        create_stat: function() {
            return new stat();
        },
        create_stat_ptr: function() {
            return ref.alloc(statPtr);
        },
        create_md_entry: function() {
            return new md_entry();
        },
        create_md_entry_ptr: function() {
            return ref.alloc(md_entryPtr);
        },
        create_md_entry_ptr_ptr: function() {
            return ref.alloc(md_entryPtrPtr);
        },
        create_UG_vacuum_context_ptr: function() {
            return ref.alloc(UG_vacuum_contextPtr);
        },
        create_UG_vacuum_context_ptr_ptr: function() {
            return ref.alloc(UG_vacuum_contextPtrPtr);
        },
        create_statvfs: function() {
            return new statvfs();
        },
        create_statvfs_ptr: function() {
            return ref.alloc(statvfsPtr);
        },
        create_integer: function() {
            return ref.alloc("int");
        },
        create_uint64: function() {
            return ref.alloc("uint64");
        }
    },
    constants: {
        MD_ENTRY_FILE: MD_ENTRY_FILE,
        MD_ENTRY_DIRECTORY: MD_ENTRY_DIRECTORY,
        O_RDONLY: O_RDONLY,
        O_WRONLY: O_WRONLY,
        O_RDWR: O_RDWR,
        SEEK_SET: 0,
        SEEK_CUR: 1,
        SEEK_END: 2,
        XATTR_CREATE_IF_NOT_EXISTS: 0,
        XATTR_CREATE: 1,
        XATTR_REPLACE: 2,
    }
};
