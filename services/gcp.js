"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var gcp_exports = {};
__export(gcp_exports, {
  default: () => gcp_default
});
module.exports = __toCommonJS(gcp_exports);
var import_medusa_interfaces = require("medusa-interfaces");
var import_storage = require("@google-cloud/storage");
var import_stream = __toESM(require("stream"));
var import_nanoid = require("nanoid");
class GcpStorageService extends import_medusa_interfaces.FileService {
  bucket_;
  credentials_;
  gcsBaseUrl;
  fileNaming = "original_random";
  constructor({}, options) {
    super();
    this.bucket_ = options.bucket;
    this.credentials_ = options.credentials;
    this.gcsBaseUrl = `https://storage.googleapis.com/${this.bucket_}/`;
    this.fileNaming = options.fileNaming || "original_random";
  }
  storage() {
    return new import_storage.Storage({
      credentials: this.credentials_
    });
  }
  upload(file) {
    let fileName = file.originalname;
    const fileWihoutExt = file.originalname.split(".").shift();
    const fileExt = file.originalname.split(".").pop();
    switch (this.fileNaming) {
      case "original":
        fileName = file.originalname;
        break;
      case "random":
        fileName = (0, import_nanoid.nanoid)(10) + `.${fileExt}`;
        break;
      case "original_random":
        fileName = `${fileWihoutExt}_${(0, import_nanoid.nanoid)(10)}.${fileExt}`;
        break;
      default:
        fileName = (0, import_nanoid.nanoid)(10) + `.${fileExt}`;
        break;
    }
    return new Promise((resolve, reject) => {
      this.storage().bucket(this.bucket_).upload(file.path, {
        destination: fileName,
        public: true
      }).then((result) => {
        const bucket_file = this.storage().bucket(this.bucket_).file(fileName);
        resolve({ url: bucket_file.publicUrl() });
      }).catch((err) => {
        console.error(err);
        reject(err);
      });
    });
  }
  delete(fileName) {
    return new Promise((resolve, reject) => {
      this.storage().bucket(this.bucket_).file(fileName).delete().then((res) => {
        resolve(res);
      }).catch((err) => {
        reject(err);
      });
    });
  }
  async getDownloadStream({ ...fileData }) {
    return this.storage().bucket(this.bucket_).file(fileData.fileKey).createReadStream();
  }
  async getUploadStreamDescriptor({ ...fileData }) {
    const fileKey = `${fileData.name}.${fileData.ext}`;
    const pass = new import_stream.default.PassThrough();
    return {
      writeStream: pass,
      promise: pass.pipe(this.storage().bucket(this.bucket_).file(fileKey).createWriteStream()),
      url: `${this.gcsBaseUrl}/${fileKey}`,
      fileKey
    };
  }
  async getPresignedDownloadUrl({ ...fileData }) {
    const fileKey = fileData.fileKey;
    const options = {
      version: "v4",
      action: "read",
      expires: Date.now() + 15 * 60 * 1e3
    };
    return this.storage().bucket(this.bucket_).file(fileKey).getSignedUrl(options);
  }
}
var gcp_default = GcpStorageService;
