const { defaultAbiCoder } = require("@ethersproject/abi");
const { BigNumber } = require("@ethersproject/bignumber");
const { keccak256 } = require("@ethersproject/keccak256");
const { pack } = require("@ethersproject/solidity");
const { toUtf8Bytes } = require("@ethersproject/strings");
const { SigningKey } = require("@ethersproject/signing-key");
const { assert, expect } = require("chai");
const ofmERC20 = artifacts.require("OfmERC20");

const ROLE_ROLE_MANAGER = web3.utils.toBN(
  "0x8000000000000000000000000000000000000000000000000000000000000000"
);
const FEATURE_TRANSFERS = 0x0000_0001;
const FEATURE_DELEGATIONS = 0x0000_0020;
const FEATURE_DELEGATIONS_ON_BEHALF = 0x0000_0040;

contract("OfmERC20", (accounts) => {
  let ofmInstance;
  const operator = accounts[0];
  const delegator1 = accounts[1];
  const delegator2 = accounts[2];
  const delegator3 = accounts[3];
  const delegate = accounts[4];
  const delegate2 = accounts[5];

  beforeEach(async () => {
    ofmInstance = await ofmERC20.new(operator);
  });

  it('delegates voting power of the account to another account', async () => {
      await ofmInstance.updateRole(delegator1, ROLE_ROLE_MANAGER, {from: operator});
      await ofmInstance.updateFeatures(FEATURE_TRANSFERS, {from: operator})
      await ofmInstance.transfer(delegator1, web3.utils.toBN(200*(10**18)), {from: operator})
      await ofmInstance.updateFeatures(FEATURE_DELEGATIONS, {from: operator})
      await ofmInstance.delegate(delegate, {from: delegator1})
      const votingHistoryLength = await ofmInstance.getVotingPowerHistoryLength(delegate)
      assert.equal(votingHistoryLength, 1)
  })

  it('gets current voting power of the account', async () => {
      await ofmInstance.updateRole(delegator1, ROLE_ROLE_MANAGER, {from: operator});
      await ofmInstance.updateFeatures(FEATURE_TRANSFERS, {from: operator})
      await ofmInstance.transfer(delegator1, web3.utils.toBN(600*(10**18)), {from: operator})
      await ofmInstance.updateFeatures(FEATURE_DELEGATIONS, {from: operator})
      await ofmInstance.delegate(delegate, {from: delegator1})
      const votingPower = await ofmInstance.getVotingPower(delegate)
      assert.equal(votingPower, 600*(10**18))
  })

  it('gets entire voting power history of the account', async () => {
      await ofmInstance.updateRole(delegator1, ROLE_ROLE_MANAGER, {from: operator})
      await ofmInstance.updateFeatures(FEATURE_TRANSFERS, {from: operator})
      await ofmInstance.transfer(delegator1, web3.utils.toBN(200*(10**18)), {from: operator})
      await ofmInstance.transfer(delegator2, web3.utils.toBN(150*(10**18)), {from: operator})
      await ofmInstance.updateFeatures(FEATURE_DELEGATIONS, {from: operator})
      await ofmInstance.delegate(delegate, {from: delegator1})
      await ofmInstance.delegate(delegate, {from: delegator2})
      const votingHistory = await ofmInstance.getVotingPowerHistory(delegate)
      assert.equal(votingHistory[1].votingPower, 350*(10**18))
  })

  it('gets voting power history length of the account', async () => {
      await ofmInstance.updateRole(delegator1, ROLE_ROLE_MANAGER, {from: operator})
      await ofmInstance.updateFeatures(FEATURE_TRANSFERS, {from: operator})
      await ofmInstance.transfer(delegator1, web3.utils.toBN(200*(10**18)), {from: operator})
      await ofmInstance.transfer(delegator2, web3.utils.toBN(300*(10**18)), {from: operator})
      await ofmInstance.transfer(delegator3, web3.utils.toBN(100*(10**18)), {from: operator})
      await ofmInstance.updateFeatures(FEATURE_DELEGATIONS, {from: operator})
      await ofmInstance.delegate(delegate, {from: delegator1})
      await ofmInstance.delegate(delegate, {from: delegator2})
      await ofmInstance.delegate(delegate2, {from: delegator3})
      const votingLength = await ofmInstance.getVotingPowerHistoryLength(delegate)
      const votingLength2 = await ofmInstance.getVotingPowerHistoryLength(delegate2)
      assert.equal(votingLength, 2)
      assert.equal(votingLength2, 1)
  })

  it('gets voting power of the account at some block', async () => {
      await ofmInstance.updateRole(delegator1, ROLE_ROLE_MANAGER, {from: operator})
      await ofmInstance.updateFeatures(FEATURE_TRANSFERS, {from: operator})
      await ofmInstance.transfer(delegator1, web3.utils.toBN(200*(10**18)), {from: operator})
      await ofmInstance.transfer(delegator2, web3.utils.toBN(300*(10**18)), {from: operator})
      await ofmInstance.updateFeatures(FEATURE_DELEGATIONS, {from: operator})
      await ofmInstance.delegate(delegate, {from: delegator1})
      await ofmInstance.delegate(delegate, {from: delegator2})
      await ofmInstance.delegate(delegate, {from: delegator3})
      const votingHistory = await ofmInstance.getVotingPowerHistory(delegate)
      const votingPowerAt = await ofmInstance.getVotingPowerAt(delegate, votingHistory[1][0])
      assert.equal(votingPowerAt, 500*(10**18))
      console.log("Block Number : ", votingHistory[1][0])
      console.log("Voting Power : ", votingPowerAt.toString())
  })

  it("delegates voting power of the signer to the delegate", async () => {
    const publicKey = "0x64ed4D73A00e5e398506736730C1778DE6979f38";
    const privateKey =
      "0x401d62477d13269191619406554b3b75c4d3484a0462b8bb84985f57eafb1a81";
    const amount = 200e18;

    await ofmInstance.updateFeatures(FEATURE_TRANSFERS, { from: operator });
    await ofmInstance.transfer(publicKey, web3.utils.toBN(amount), {
      from: operator,
    });

    const nonce = 0;
    const exp = new Date().setMonth(new Date().getMonth() + 1);

    const name = "Ocean Floor Music";
    const chainId = await web3.eth.getChainId();

    const domainSeparator = keccak256(
      defaultAbiCoder.encode(
        ["bytes32", "bytes32", "uint256", "address"],
        [
          keccak256(
            toUtf8Bytes(
              "EIP712Domain(string name,uint256 chainId,address verifyingContract)"
            )
          ),
          keccak256(toUtf8Bytes(name)),
          chainId,
          ofmInstance.address,
        ]
      )
    );

    const hashStruct = keccak256(
      defaultAbiCoder.encode(
        ["bytes32", "address", "uint256", "uint256"],
        [
          keccak256(
            toUtf8Bytes(
              "Delegation(address delegate,uint256 nonce,uint256 expiry)"
            )
          ),
          delegator1,
          nonce,
          exp,
        ]
      )
    );

    const digest = keccak256(
      pack(
        ["bytes1", "bytes1", "bytes32", "bytes32"],
        ["0x19", "0x01", domainSeparator, hashStruct]
      )
    );

    const signingKey = new SigningKey(privateKey);
    const signature = signingKey.signDigest(digest);

    await ofmInstance.updateFeatures(FEATURE_DELEGATIONS_ON_BEHALF, {
      from: operator,
    });

    await ofmInstance.delegateWithSig(
      delegator1,
      nonce,
      exp,
      signature.v,
      signature.r,
      signature.s
    );

    const delegator1VotingPower = await ofmInstance.getVotingPower(delegator1);
    expect(amount).to.be.equal(parseInt(delegator1VotingPower));
  });
});
