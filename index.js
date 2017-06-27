const { nodes, signedTxs, target } = require("./config.json");
const Web3 = require('web3');
const a = require('awaiting');

const providers = Object.keys(nodes).map(url => ({
  url,
  web3: new Web3(new Web3.providers.HttpProvider(url)),
  tx: nodes[url].tx,
}))

providers.forEach(({ web3, url, tx }, i) => {
  const trimmedUrl = url.split('//')[1].substr(0, 15);
  function poll () {
    web3.eth.getBlockNumber((err, block) => {
      if(block !== providers[i].block) {
        providers[i].block = block;
        const toGo = block - target;
        let txToPublish;
        if (target !== 0) {
          txToPublish = tx[`${toGo}`] || [];
          const estTime = -(toGo * 16.5) * 1000;
          const h = Math.floor((estTime % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
          const m = Math.floor((estTime % (1000 * 60 * 60)) / (1000 * 60));
          const s = Math.floor((estTime % (1000 * 60)) / 1000);
          console.log(`${trimmedUrl} got block ${block} ${toGo} blocks, ${h}h ${m}m ${s}s`);
        } else {
          txToPublish = tx[0] || [];
        }
        txToPublish.forEach((txNumber) => {
          console.log(`${trimmedUrl} publishing tx ${txNumber}...`);
          const rawTx = signedTxs[txNumber];
          web3.eth.sendRawTransaction(rawTx, (err, res) => {
            if (err) {
              console.log(`${trimmedUrl} published tx ${txNumber} : ERROR ${err}`);
            } else {
              console.log(`${trimmedUrl} published tx ${txNumber} : SUCCESS! ${res}`);
            }
          });
        });
      }
      setTimeout(poll, 500); // poll every 0.5s;
    });
  }
  poll();
});
