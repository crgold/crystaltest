'use client'
import React, { useState } from 'react';
import { TempleWallet } from '@temple-wallet/dapp';
import { TezosToolkit } from '@taquito/taquito';
import { InMemorySigner } from '@taquito/signer';

import 'tailwindcss/tailwind.css';

const TezosContract: React.FC = () => {
  const [connected, setConnected] = useState<boolean>(false);
  const [walletAddress, setWalletAddress] = useState<string | undefined>('');
  const [balance, setBalance] = useState<number>();
  const [tezos, setTezos] = useState<TezosToolkit>();
  const [Tezos] = useState<TezosToolkit>(new TezosToolkit("https://ghostnet.smartpy.io"));

  Tezos.setProvider({
    signer: new InMemorySigner(process.env.NEXT_PUBLIC_PRIVATE_KEY!),
  });

  const contractAddress: string = 'KT1HTphtfX4mWv8BUCb6gL4FLZGMq6MeQTnw';

  const connectWallet = async (): Promise<void> => {
    try {
      const available = await TempleWallet.isAvailable();
      if (!available) {
        throw new Error("Temple Wallet not installed");
      }

      const wallet: TempleWallet = new TempleWallet('MyAwesomeDapp');
      await wallet.connect('ghostnet');
      const tezosInstance = wallet.toTezos();
      setTezos(tezosInstance);
      const address: string = await tezosInstance.wallet.pkh();
      setWalletAddress(address);
      setConnected(true);
    } catch (error: any) {
      console.error('Error connecting wallet:', error);
    }
  };

  const getBalance = async (): Promise<void> => {
    try {
      if (!tezos) {
        throw new Error('Tezos not initialized');
      }
      const userWallet = await tezos.wallet.pkh();
      const contract = await tezos.wallet.at(contractAddress);
      const result = await contract.contractViews.get_balance_of([{owner: userWallet, token_id: 0}]).executeView({
        source: userWallet,
        viewCaller: contractAddress
      });
      console.log(result[0].balance.c[0]);
      if (result) {
        setBalance(result[0].balance.c[0]);
      }
    } catch (error: any) {
      console.error('Error getting balance:', error);
    }
  };

  const mintToken = async (): Promise<void> => {
    try {
      if (!Tezos || !tezos) {
        throw new Error('Tezos not initialized');
      }
      const contract = await Tezos.contract.at(contractAddress); // Use Tezos for contract initialization
      const mintOne = 1;

      console.log(`Minting ${mintOne} crystal...`);
      const operation = await contract?.methodsObject.mint([{ to_: await tezos.wallet.pkh(), amount: mintOne }])?.send();

      console.log(`Waiting for ${operation?.hash} to be confirmed...`);
      await operation?.confirmation(1);

      console.log(`Operation injected: https://testnet.tzstats.com/${operation?.hash}`);
      window.alert(`Mint operation successful! https://testnet.tzstats.com/${operation?.hash}`);
      await getBalance(); // Update balance after minting
    } catch (error: any) {
      console.error('Error minting tokens:', error);
      window.alert('Error minting tokens: ' + error.message);
    }
  };

  const burnToken = async (): Promise<void> => {
    try {
      if (!tezos) {
        throw new Error('Tezos not initialized');
      }
      const contract = await tezos.wallet.at(contractAddress); // Use Tezos for contract initialization
      const ONE = 1;

      console.log(`Burning ${ONE} crystal...`);
      const operation = await contract.methodsObject.burn([{ from_: await tezos.wallet.pkh(), token_id: 0, amount: ONE }]).send();

      console.log(`Waiting for ${operation?.opHash} to be confirmed...`);
      await operation?.confirmation(1);

      console.log(`Operation injected: https://testnet.tzstats.com/${operation?.opHash}`);
      window.alert(`Burn operation successful! https://testnet.tzstats.com/${operation?.opHash}`);
      await getBalance(); // Update balance after minting
    } catch (error: any) {
      console.error('Error burning tokens:', error);
      window.alert('Error burning tokens: ' + error.message);
    }
  };

  return (
    <div className="container mx-auto mt-5">
      <h1 className="text-3xl font-semibold mb-5">Tezos Smart Contract Interaction</h1>
      {!connected && (
        <button className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mt-3" onClick={connectWallet}>
          Connect Wallet
        </button>
      )}
      {connected && (
        <div>
          <p>Connected Wallet Address: {walletAddress}</p>
          {balance !== undefined && <p>Balance: {balance}</p>}
          <button className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded mt-3" onClick={mintToken}>
            Mint Token
          </button>
          <button className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded mt-3 ml-3" onClick={burnToken}>
            Burn Token
          </button>
          <button className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded mt-3 ml-3" onClick={getBalance}>
            Get Balance
          </button>
        </div>
      )}
    </div>
  );
};

export default TezosContract;
