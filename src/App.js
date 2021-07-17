import "./App.css";
import React, { useEffect, useRef, useMemo, useState } from "react";
import Wallet from "@project-serum/sol-wallet-adapter";
import { Connection, SystemProgram, Transaction } from "@solana/web3.js";
function toHex(buffer: Buffer) {
  return Array.prototype.map
    .call(buffer, (x: number) => ("00" + x.toString(16)).slice(-2))
    .join("");
}

function App() {
  const [logs, setLogs] = useState([]);
  function addLog(log: string) {
    setLogs((logs) => [...logs, log]);
  }
  const user_message = useRef(null);
  const network = "devnet";
  const [providerUrl, setProviderUrl] = useState("https://www.sollet.io");
  const connection = useMemo(() => new Connection(network), [network]);
  const urlWallet = useMemo(
    () => new Wallet(providerUrl, network),
    [providerUrl, network]
  );

  const [selectedWallet, setSelectedWallet] = useState();
  const [, setConnected] = useState(false);
  useEffect(() => {
    if (selectedWallet) {
      selectedWallet.on("connect", () => {
        setConnected(true);
        addLog(
          `Connected to wallet ${selectedWallet.publicKey?.toBase58() ?? "--"}`
        );
      });
      selectedWallet.on("disconnect", () => {
        setConnected(false);
        addLog("Disconnected from wallet");
      });
      void selectedWallet.connect();
      return () => {
        void selectedWallet.disconnect();
      };
    }
  }, [selectedWallet]);

  async function signMessage() {
    try {
      if (!selectedWallet) {
        throw new Error("wallet not connected");
      }
      const message = user_message.current.value;

      const data = new TextEncoder().encode(message);
      const signed = await selectedWallet.sign(data, "hex");
      addLog("Got signature: " + toHex(signed.signature));
    } catch (e) {
      console.warn(e);
    }
  }

  return (
    <div className="App">
      <h1>Wallet Demo</h1>
      <div>Network: {network}</div>
      <div>
        Waller provider:{" "}
        <input
          type="text"
          value={providerUrl}
          onChange={(e) => setProviderUrl(e.target.value.trim())}
        />
      </div>
      {selectedWallet && selectedWallet.connected ? (
        <div>
          <div>Wallet address: {selectedWallet.publicKey?.toBase58()}.</div>
          <label> Enter message to sign</label>
          <input type="text" ref={user_message} name="user_message" />

          <button onClick={signMessage}>Sign Message</button>
          <button onClick={() => selectedWallet.disconnect()}>
            Disconnect
          </button>
        </div>
      ) : (
        <div>
          <button onClick={() => setSelectedWallet(urlWallet)}>
            Connect to Wallet
          </button>
        </div>
      )}
      <hr />
      <div className="logs">
        {logs.map((log, i) => (
          <>
            {" "}
            <div key={i}>{log}</div>
            <br />
          </>
        ))}
      </div>
    </div>
  );
}

export default App;
