const { inTransaction } = require("@openzeppelin/test-helpers/src/expectEvent")
const { assert } = require("chai")

const OfmxERC20 = artifacts.require('OfmxERC20')

const FEATURE_OWN_BURNS = 0x0000_0008;

contract("OfmxERC20", async (accounts) => {

    let ofmxERC20
    let operator = accounts[0]
    let recipient = accounts[1]

    beforeEach(async () => {
        ofmxERC20 = await OfmxERC20.new(operator)
    })

    it('mints Ofmx tokens', async () => {
        // mint tokens to recipient
        await ofmxERC20.mint(recipient, web3.utils.toBN(200 * (10 ** 18)), { from: operator })
        const balance = (await ofmxERC20.balanceOf(recipient)).toString()

        // verify that the tokens were minted to recipient
        assert.equal(balance, web3.utils.toBN(200 * (10 ** 18)), 'balance of recipient and amount minted to it must be equal')
    })

    it('burns Ofmx tokens', async () => {
        // enable burn feature
        await ofmxERC20.updateFeatures(FEATURE_OWN_BURNS, { from: operator })

        // mint some ofmx to operator
        await ofmxERC20.mint(operator, web3.utils.toBN(200 * (10 ** 18)))

        // burn some ofmx tokens
        await ofmxERC20.burn(web3.utils.toBN(100 * (10 ** 18)), { from: operator })
        const finalBalance = (await ofmxERC20.balanceOf(operator)).toString();

        // verify that the tokens were burnt
        assert.equal(finalBalance, web3.utils.toBN(100 * (10 ** 18)))
    })

    it('pauses the state of the contract', async () => {
        // minting before pausing
        await ofmxERC20.mint(recipient, web3.utils.toBN(200 * (10 ** 18)))
        
        // pausing the contract
        await ofmxERC20.pause(true, {from: operator})

        // minting after pausing
        try {
            await ofmxERC20.mint(recipient, web3.utils.toBN(200 * (10 ** 18)))
            console.log("Working even after pausing")
        } catch (error) {}

        // unpausing the contract
        await ofmxERC20.pause(false, {from: operator})

        // minting after unpausing
        await ofmxERC20.mint(recipient, web3.utils.toBN(200 * (10 ** 18)))
        const recipientBalance = (await ofmxERC20.balanceOf(recipient)).toString();

        // verify the correct balance
        assert.equal(recipientBalance, web3.utils.toBN(400 * (10 ** 18)))

    })
})