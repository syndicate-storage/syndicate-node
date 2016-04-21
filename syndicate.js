/*
   Copyright 2015 The Trustees of Princeton University

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
 * This module provides a high-level APIs to handle Syndicate Gateways
 */

var libsyndicate_node = require('./libsyndicate.js');
var libsyndicate = libsyndicate_node.libsyndicate;
var libsyndicate_ug = libsyndicate_node.libsyndicate_ug;
var posixerr = require('./posix_errors.js');

var ref = require('ref');
var async = require('async');

function addRawStatHelpers(entry) {
    entry.isFile = function() {
        if(entry.type === libsyndicate_node.constants.MD_ENTRY_FILE) {
            return true;
        }
        return false;
    };
    entry.isDir = function() {
        if(entry.type === libsyndicate_node.constants.MD_ENTRY_DIRECTORY) {
            return true;
        }
        return false;
    };
}

/**
 * Expose root class
 */
module.exports = {
    // create init opts
    create_opts: function(user, volume, gateway, anonymous) {
        user = user || "";
        volume = volume || "";
        gateway = gateway || "";
        anonymous = anonymous || false;

        return {
            user: user,
            volume: volume,
            gateway: gateway,
            anonymous: anonymous
        };
    },
    // initialize UG
    init: function(opts) {
        if(!opts) {
            throw "Invalid arguments";
        }

        // build syndicate arguments
        var args=[];
        // program name: 
        args.push("libsyndicate-node.js");

        // user: -u flag
        if(opts.user !== "") {
            args.push("-u");
            args.push(opts.user);
        }
        // volume: -v flag
        if(opts.volume !== "") {
            args.push("-v");
            args.push(opts.volume);
        }
        // gateway: -g flag
        if(opts.gateway !== "") {
            args.push("-g");
            args.push(opts.gateway);
        }
        // anonymous: -a flag
        if(opts.anonymous) {
            args.push("-A");
        }
        
        var ug = libsyndicate_ug.UG_init(args.length, args, opts.anonymous);
        if(ug.isNull()) {
            throw "UG_init failed";
        }
        return ug;
    },
    // shutdown UG
    shutdown: function(ug) {
        if(!ug) {
            throw "Invalid arguments";
        }

        // shutdown UG
        libsyndicate_ug.UG_shutdown( ug );
    },
    // stat-raw
    stat_raw: function(ug, path) {
        if(!ug) {
            throw "Invalid arguments";
        }

        if(!path) {
            throw "Invalid arguments";
        }

        var entry = libsyndicate_node.helpers.create_md_entry();
        // load up...
        var rc = libsyndicate_ug.UG_stat_raw(ug, path, entry.ref());
        if(rc !== 0) {
            throw "Failed to stat '" + path + "': " + posixerr.strerror(-rc);
        }

        var statEntry = JSON.parse(JSON.stringify(entry));
        addRawStatHelpers(statEntry);
        return statEntry;
    },
    // stat-raw async
    stat_raw_async: function(ug, path, callback) {
        if(!ug) {
            callback("Invalid arguments", null);
            return;
        }

        if(!path) {
            callback("Invalid arguments", null);
            return;
        }

        var entry = libsyndicate_node.helpers.create_md_entry();
        // load up...
        libsyndicate_ug.UG_stat_raw.async(ug, path, entry.ref(), function(err, rc) {
            if(err) {
                callback(err, null);
                return;
            }

            if(rc !== 0) {
                callback("Failed to stat '" + path + "': " + posixerr.strerror(-rc), null);
                return;
            }

            var statEntry = JSON.parse(JSON.stringify(entry));
            addRawStatHelpers(statEntry);
            callback(null, statEntry);
            return;
        });
    },
    // list-dir
    list_dir: function(ug, path) {
        if(!ug) {
            throw "Invalid arguments";
        }

        if(!path) {
            throw "Invalid arguments";
        }

        var rc = 0;
        var rc2 = libsyndicate_node.helpers.create_integer();
        var dirh = libsyndicate_ug.UG_opendir(ug, path, rc2);
        if(dirh.isNull()) {
            throw "Failed to open directory '" + path + "': " + posixerr.strerror(-rc2.deref());
        }

        var entries = [];

        while(true) {
            var dirents = libsyndicate_node.helpers.create_md_entry_ptr_ptr();
            rc = libsyndicate_ug.UG_readdir(ug, dirents, 1, dirh);
            if(rc !== 0) {
                libsyndicate_ug.UG_closedir(ug, dirh);
                throw "Failed to read directory '" + path + "': " + posixerr.strerror(-rc);
            }
            
            var dirents_d = dirents.deref();
            if(!dirents_d.isNull()) {
                var dirents_d = dirents.deref();
                var entry = ref.get(dirents_d, 0, ref.types.pointer);
                if(entry.isNull()) {
                    // EOF 
                    libsyndicate_ug.UG_free_dir_listing(dirents_d);
                    break;
                }

                var j = 0;
                while(!entry.isNull()) {
                    var statEntry = JSON.parse(JSON.stringify(entry.deref()));
                    addRawStatHelpers(statEntry);
                    entries.push(statEntry);

                    j++;
                    entry = ref.get(dirents_d, ref.sizeof.pointer * j, ref.types.pointer);
                }
                
                libsyndicate_ug.UG_free_dir_listing(dirents_d);
            } else {
                // no data
                break;
            }
        }
        
        rc = libsyndicate_ug.UG_closedir(ug, dirh);
        if(rc !== 0) {
            throw "Failed to close directory '" + path + "': " + posixerr.strerror(-rc);
        }

        return entries;
    },
    // list-dir async.
    list_dir_async: function(ug, path, callback) {
        if(!ug) {
            callback("Invalid arguments", null);
            return;
        }

        if(!path) {
            callback("Invalid arguments", null);
            return;
        }

        var rc2 = libsyndicate_node.helpers.create_integer();
        
        async.waterfall([
            function(cb) {
                libsyndicate_ug.UG_opendir.async(ug, path, rc2, function(err, dirh) {
                    if(err) {
                        cb(err, null);
                        return;
                    }

                    if(dirh.isNull()) {
                        cb("Failed to open directory '" + path + "': " + posixerr.strerror(-rc2.deref()), null);
                        return;
                    }

                    cb(null, dirh);
                });
            },
            function(dirh, cb) {
                var entries = [];

                var stopWhile = false;
                async.whilst(
                    function() {
                        return !stopWhile;
                    },
                    function(loop_cb) {
                        var dirents = libsyndicate_node.helpers.create_md_entry_ptr_ptr();
                        libsyndicate_ug.UG_readdir.async(ug, dirents, 1, dirh, function(err, rc) {
                            if(err) {
                                stopWhile = true;
                                loop_cb(err, null);
                                return;
                            }

                            if(rc !== 0) {
                                stopWhile = true;
                                loop_cb("Failed to read directory '" + path + "': " + posixerr.strerror(-rc), null);
                                return;
                            }

                            var dirents_d = dirents.deref();
                            if(!dirents_d.isNull()) {
                                var dirents_d = dirents.deref();
                                var entry = ref.get(dirents_d, 0, ref.types.pointer);
                                if(entry.isNull()) {
                                    // EOF 
                                    libsyndicate_ug.UG_free_dir_listing(dirents_d);
                                    stopWhile = true;
                                    loop_cb(null, null);
                                    return;
                                }

                                var j = 0;
                                while(!entry.isNull()) {
                                    var statEntry = JSON.parse(JSON.stringify(entry.deref()));
                                    addRawStatHelpers(statEntry);
                                    entries.push(statEntry);

                                    j++;
                                    entry = ref.get(dirents_d, ref.sizeof.pointer * j, ref.types.pointer);
                                }
                                
                                libsyndicate_ug.UG_free_dir_listing(dirents_d);
                                loop_cb(null, null);
                                return;
                            } else {
                                // no data
                                stopWhile = true;
                                loop_cb(null, null);
                                return;
                            }
                        });
                    },
                    function(err, data) {
                        libsyndicate_ug.UG_closedir.async(ug, dirh, function(cerr, rc) {
                            if(cerr) {
                                cb(cerr, null);
                                return;
                            }

                            if(rc !== 0) {
                                cb("Failed to close directory '" + path + "': " + posixerr.strerror(-rc), null);
                                return;
                            }

                            cb(err, entries);
                            return;
                        });
                    }
                );
            }
        ], function(err, result) {
            callback(err, result);
        });
    },
    // open
    open: function(ug, path, flag) {
        if(!ug) {
            throw "Invalid arguments";
        }

        if(!path) {
            throw "Invalid arguments";
        }

        var seek_to_end = false;
        var create = false;
        var truncate = false;
        if(flag === "r") {
            flag = libsyndicate_node.constants.O_RDONLY;
            seek_to_end = false;
            create = false;
            truncate = false;
        } else if(flag === "w") {
            flag = libsyndicate_node.constants.O_WRONLY;
            seek_to_end = false;
            create = true;
            truncate = true;
        } else if(flag === "a") {
            flag = libsyndicate_node.constants.O_RDWR;
            seek_to_end = true;
            create = true;
            truncate = false;
        } else {
            flag = libsyndicate_node.constants.O_RDONLY;
            seek_to_end = false;
            create = false;
            truncate = false;
        }

        var rc = 0;
        var rc2 = libsyndicate_node.helpers.create_integer();
        var fh;
        if(create) {
            fh = libsyndicate_ug.UG_create(ug, path, 0o0540, rc2);   
            if(rc2.deref() !== 0) { 
                if(rc2.deref() !== -17) {
                    // Not EEXIST
                    throw "Failed to create a file '" + path + "': " + posixerr.strerror(-rc2.deref());
                } else {
                    // EEXIST
                    fh = libsyndicate_ug.UG_open(ug, path, flag, rc2);
                    if(rc2.deref() !== 0) {
                        throw "Failed to open a file '" + path + "': " + posixerr.strerror(-rc2.deref());
                    }

                    if(truncate) {
                        rc = libsyndicate_ug.UG_ftruncate(ug, 0, fh);
                        if(rc !== 0) {
                            libsyndicate_ug.UG_close(ug, fh);
                            throw "Failed to truncate a file '" + path + "': " + posixerr.strerror(-rc);
                        }
                    }
                }
            }
        } else {
            fh = libsyndicate_ug.UG_open(ug, path, flag, rc2);
            if(rc2.deref() !== 0) {
                throw "Failed to open a file '" + path + "': " + posixerr.strerror(-rc2.deref());
            }
        }

        if(seek_to_end) {
            // SEEK
            var new_offset = libsyndicate_ug.UG_seek(fh, 0, libsyndicate_node.constants.SEEK_END);
            if(new_offset < 0) {
                libsyndicate_ug.UG_close(ug, fh);
                throw "Failed to seek a file '" + path + "': " + posixerr.strerror(-new_offset);
            }
        }
        return fh;
    },
    // close
    close: function(ug, fh) {
        if(!ug) {
            throw "Invalid arguments";
        }

        if(!fh) {
            throw "Invalid arguments";
        }

        var rc = libsyndicate_ug.UG_close(ug, fh);
        if(rc !== 0) {
            throw "Failed to close a file '" + fh + "': " + posixerr.strerror(-rc);
        }
    },
    // fsync
    fsync: function(ug, fh) {
        if(!ug) {
            throw "Invalid arguments";
        }

        if(!fh) {
            throw "Invalid arguments";
        }

        var rc = libsyndicate_ug.UG_fsync(ug, fh);
        if(rc !== 0) {
            throw "Failed to sync a file '" + fh + "': " + posixerr.strerror(-rc);
        }
    },
    // seek
    seek: function(ug, fh, offset) {
        if(!ug) {
            throw "Invalid arguments";
        }

        if(!fh) {
            throw "Invalid arguments";
        }

        if(offset < 0) {
            throw "Invalid arguments";
        }

        // SEEK
        var new_offset = libsyndicate_ug.UG_seek(fh, offset, libsyndicate_node.constants.SEEK_SET);
        if(new_offset < 0) {
            throw "Failed to seek a file '" + fh + "': " + posixerr.strerror(-new_offset);
        }
        return new_offset;
    },
    // read
    read: function(ug, fh, size) {
        if(!ug) {
            throw "Invalid arguments";
        }

        if(!fh) {
            throw "Invalid arguments";
        }

        if(size < 0) {
            throw "Invalid arguments";
        }

        // make a return buffer
        var ret_buf = new Buffer(size);
        if( ret_buf.isNull() ) {
            throw "Failed to create a buffer: Out of memory";
        }
        ret_buf.type = ref.types.CString;

        // make a read buffer
        var read_buf = new Buffer(size);
        if( read_buf.isNull() ) {
            throw "Failed to create a buffer: Out of memory";
        }
        read_buf.type = ref.types.CString;

        // READ
        var size_left = size;
        var size_read_total = 0;
        while(size_left > 0) {
            var size_read = libsyndicate_ug.UG_read(ug, read_buf, size_left, fh);
            if(size_read < 0) {
                throw "Failed to read a file '" + fh + "': " + posixerr.strerror(-size_read);
            } else if(size_read === 0) {
                // EOF
                break;
            } else {
                read_buf.copy(ret_buf, size_read_total, 0, size_read);
                size_left -= size_read;
                size_read_total += size_read;
            }
        }

        return ret_buf.slice(0, size_read_total);
    },
    // write
    write: function(ug, fh, buf) {
        if(!ug) {
            throw "Invalid arguments";
        }

        if(!fh) {
            throw "Invalid arguments";
        }

        if(!buf) {
            throw "Invalid arguments";
        }

        // WRITE
        var size_left = buf.length;
        var size_write_total = 0;
        while(size_left > 0) {
            var size_write = libsyndicate_ug.UG_write(ug, read_buf, size_left, fh);
            if(size_write < 0) {
                throw "Failed to write a file '" + fh + "': " + posixerr.strerror(-size_write);
            } else {
                size_left -= size_write;
                size_write_total += size_write;
            }
        }

        return size_write_total;
    },
    // rename
    rename: function(ug, src_path, dest_path) {
        if(!ug) {
            throw "Invalid arguments";
        }

        if(!src_path) {
            throw "Invalid arguments";
        }

        if(!dest_path) {
            throw "Invalid arguments";
        }

        // rename
        var rc = libsyndicate_ug.UG_rename(ug, src_path, dest_path);
        if(rc !== 0) {
            throw "Failed to rename '" + src_path + " to " + dest_path + "': " + posixerr.strerror(-rc);
        }
    },
    // unlink
    unlink: function(ug, path) {
        if(!ug) {
            throw "Invalid arguments";
        }

        if(!path) {
            throw "Invalid arguments";
        }

        // unlink
        var rc = libsyndicate_ug.UG_unlink(ug, path);
        if(rc !== 0) {
            throw "Failed to unlink '" + path + "': " + posixerr.strerror(-rc);
        }
    },
    // mkdir
    mkdir: function(ug, path, mode) {
        if(!ug) {
            throw "Invalid arguments";
        }

        if(!path) {
            throw "Invalid arguments";
        }
        
        // get mask
        mode = mode || (process.umask() & 0o0777);

        // mkdir
        var rc = libsyndicate_ug.UG_mkdir(ug, path, mode);
        if(rc !== 0) {
            throw "Failed to mkdir '" + path + "': " + posixerr.strerror(-rc);
        }
    },
    // rmdir
    rmdir: function(ug, path) {
        if(!ug) {
            throw "Invalid arguments";
        }

        if(!path) {
            throw "Invalid arguments";
        }

        // rmdir
        var rc = libsyndicate_ug.UG_rmdir(ug, path);
        if(rc !== 0) {
            throw "Failed to rmdir '" + path + "': " + posixerr.strerror(-rc);
        }
    },
    // listxattr
    list_xattr: function(ug, path) {
        if(!ug) {
            throw "Invalid arguments";
        }

        if(!path) {
            throw "Invalid arguments";
        }
        
        // check length
        var len = libsyndicate_ug.UG_listxattr(ug, path, null, 0);
        if(len < 0) {
            throw "Failed to listxattr '" + path + "' : " + posixerr.strerror(-len);
        }

        if(len == 0) {
            return [];
        }

        // make a read buffer
        var read_buf = new Buffer(len);
        if( read_buf.isNull() ) {
            throw "Failed to create a buffer: Out of memory";
        }
        read_buf.type = ref.types.CString;

        // getxattr
        var rc = libsyndicate_ug.UG_listxattr(ug, path, read_buf, len);
        if(rc < 0) {
            throw "Failed to listxattr '" + path + "' : " + posixerr.strerror(-rc);
        }

        var xattrs = [];

        // split with \0 
        var i = 0;
        var start_offset = 0;
        for(i=0;i<rc;i++) {
            if(read_buf[i] === 0) {
                // null?
                xattrs.push(read_buf.slice(start_offset, i + 1).toString());
                start_offset = i + 1;
            }
        }

        return xattrs;
    },
    // getxattr
    get_xattr: function(ug, path, key) {
        if(!ug) {
            throw "Invalid arguments";
        }

        if(!path) {
            throw "Invalid arguments";
        }

        if(!key) {
            throw "Invalid arguments";
        }

        // check length
        var len = libsyndicate_ug.UG_getxattr(ug, path, key, null, 0);
        if(len < 0) {
            throw "Failed to getxattr '" + path + "' key=" + key + " : " + posixerr.strerror(-len);
        }

        if(len == 0) {
            return null;
        }

        // make a read buffer
        var read_buf = new Buffer(len);
        if( read_buf.isNull() ) {
            throw "Failed to create a buffer: Out of memory";
        }
        read_buf.type = ref.types.CString;

        // getxattr
        var rc = libsyndicate_ug.UG_getxattr(ug, path, key, read_buf, len);
        if(rc < 0) {
            throw "Failed to getxattr '" + path + "' key=" + key + " : " + posixerr.strerror(-rc);
        }
        return read_buf.slice(0, rc);
    },
    // setxattr
    set_xattr: function(ug, path, key, value) {
        if(!ug) {
            throw "Invalid arguments";
        }

        if(!path) {
            throw "Invalid arguments";
        }

        if(!key) {
            throw "Invalid arguments";
        }

        if(!value) {
            throw "Invalid arguments";
        }

        var flag = libsyndicate_node.constants.XATTR_CREATE_IF_NOT_EXISTS;

        // setxattr
        var rc = libsyndicate_ug.UG_setxattr(ug, path, key, value, value.length, flag);
        if(rc !== 0) {
            throw "Failed to setxattr '" + path + "' key=" + key + ", value=" + value + " : " + posixerr.strerror(-rc);
        }
    },
    // removexattr
    remove_xattr: function(ug, path, key) {
        if(!ug) {
            throw "Invalid arguments";
        }

        if(!path) {
            throw "Invalid arguments";
        }

        if(!key) {
            throw "Invalid arguments";
        }

        // removexattr
        var rc = libsyndicate_ug.UG_removexattr(ug, path, key);
        if(rc !== 0) {
            throw "Failed to removexattr '" + path + "' key=" + key + ": " + posixerr.strerror(-rc);
        }
    },
    // statvfs
    statvfs: function(ug) {
        if(!ug) {
            throw "Invalid arguments";
        }

        // statvfs
        var entry = libsyndicate_node.helpers.create_statvfs();
        // load up...
        var rc = libsyndicate_ug.UG_statvfs(ug, entry.ref());
        if(rc !== 0) {
            throw "Failed to statvfs: " + posixerr.strerror(-rc);
        }

        var statvfsEntry = JSON.parse(JSON.stringify(entry));
        return statvfsEntry;
    }
};

