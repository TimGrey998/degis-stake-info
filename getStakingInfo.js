const dotenv = require("dotenv")
const { ethers } = require("ethers")
const Moralis = require("moralis/node")
const abiCoder = new (require("ethers").utils.AbiCoder)()
dotenv.config()

const reqAddress = process.argv[2]
if (!reqAddress) {
  console.error("please input address")
  process.exit(0)
}
if (!ethers.utils.isAddress(reqAddress)) {
  console.error("invalid address")
  process.exit(0)
}

const getStakeLogsByAddress = async (address) => {
  const options = {
    address: "0x1d647379e4006768ab1b2b19495594ebe3fa4f9d",
    chain: "avalanche",
    topic0:
      "0x5af417134f72a9d41143ace85b0a26dce6f550f894f2cbc1eeee8810603d91b6",
  }
  const logs = (await Moralis.Web3API.native.getLogsByAddress(options)).result
  const addressLogData = []
  logs.forEach((log) => {
    if (log.data) {
      const res = decodeLogData(log)
      if (res.address.toLowerCase() == address.toLowerCase())
        addressLogData.push(res)
    }
  })
  return addressLogData
}

const decodeLogData = (log) => {
  const res = abiCoder.decode(["address", "uint256", "uint256"], log.data)
  return {
    address: res[0],
    amount: ethers.utils.formatEther(res[1]),
    lockStart: new Date(log.block_timestamp).toLocaleString(),
    lockUntil: new Date(res[2].toNumber() * 1000).toLocaleString(),
  }
}

const main = async () => {
  await Moralis.start({
    serverUrl: process.server_url,
    appId: process.env.app_id,
    moralisSecret: process.env.moralis_secret,
  })
  const stakeLogs = await getStakeLogsByAddress(reqAddress)
  if (stakeLogs.length) console.log(stakeLogs)
  else console.log("no log found")
}

main()
  .catch((err) => console.error(err))
  .then(() => process.exit(0))
