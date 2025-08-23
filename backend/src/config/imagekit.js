const ImageKit = require("imagekit");

const imagekit = new ImageKit({
  publicKey: process.env.VITE_IK_PUBLIC_KEY,
  privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
  urlEndpoint: process.env.VITE_IK_URL_ENDPOINT,
});

module.exports = { imagekit };
