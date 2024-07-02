import detectEthereumProvider from "@metamask/detect-provider";
import { ENVS } from "./configurations/index";

export const connectWallet = async () => {
    const provider = await detectEthereumProvider();

    if (provider) {
        try {
            const walletChainId = await provider.request({
                method: "eth_chainId",
            });

            if (walletChainId === ENVS.CHAIN_ID) {
                const addressArray = await provider.request({
                    method: "eth_requestAccounts",
                });

                if (addressArray.length) {
                    return {
                        address: addressArray[0],
                        status: "Connected",
                    };
                } else {
                    return {
                        address: "",
                        status: "No wallet connected",
                    };
                }
            } else {
                await switchNetwork(provider);
                const addressArray = await provider.request({
                    method: "eth_requestAccounts",
                });

                if (addressArray.length) {
                    return {
                        address: addressArray[0],
                        status: "Connected",
                    };
                } else {
                    return {
                        address: "",
                        status: "No wallet connected",
                    };
                }
            }
        } catch (err) {
            return {
                address: "",
                status: `😥 ${err.message}`,
            };
        }
    } else {
        console.log(`🦊 You must install Metamask, a virtual Ethereum wallet, in your browser.(https://metamask.io/download.html)`);
        return {
            address: "",
            status: "Can't find web3 provider",
        };
    }
};

const switchNetwork = async (provider) => {
    try {
        await provider.request({
            method: "wallet_switchEthereumChain",
            params: [{ chainId: ENVS.CHAIN_ID }],
        });
    } catch (switchError) {
        if (switchError.code === 4902) {
            try {
                await provider.request({
                    method: "wallet_addEthereumChain",
                    params: [{
                        chainId: ENVS.CHAIN_ID,
                        rpcUrls: [ENVS.RPC_URL],
                        chainName: ENVS.CHAIN_NAME,
                    }],
                });
            } catch (addError) {
                throw addError;
            }
        } else {
            throw switchError;
        }
    }
};

export const getCurrentWalletConnected = async () => {
    const provider = await detectEthereumProvider();

    if (provider) {
        try {
            const addressArray = await provider.request({
                method: "eth_accounts",
            });
            const walletChainId = await provider.request({
                method: "eth_chainId",
            });
            if (addressArray.length && walletChainId === ENVS.CHAIN_ID) {
                return {
                    address: addressArray[0],
                    status: "Get your SadPug pack, 0.013ETH",
                };
            } else {
                return {
                    address: "",
                    status: "Connect Metamask",
                };
            }
        } catch (err) {
            return {
                address: "",
                status: `😥 ${err.message}`,
            };
        }
    } else {
        console.log(`🦊 You must install Metamask, a virtual Ethereum wallet, in your browser.(https://metamask.io/download.html)`);
        return {
            address: "",
            status: "Can't find web3 provider",
        };
    }
};
