"use client"
import React, { useState, useEffect } from 'react';
import { Connection, Keypair, LAMPORTS_PER_SOL, PublicKey, Transaction, TransactionInstruction } from "@solana/web3.js";
import * as borsh from "borsh";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Loader2, Send, Wallet, CheckCircle, AlertCircle, RefreshCw, Database, Plus, Minus, Settings, Copy, ExternalLink, TrendingUp, Activity } from 'lucide-react';

// Define the schema (you'll need to adjust this based on your actual schema)
const InstructionSchema: borsh.Schema = {
  enum: [
    {
      struct: {
        Increment: {
          struct: {
            num1: 'u32'
          }
        }
      }
    },
    {
      struct: {
        Decrement: {
          struct: {
            num1: 'u32'
          }
        }
      }
    }
  ]
};
// const DecrementSchema:borsh.Schema = {
//     enum: [
//         {
//             struct: {
//                 Decrement: {
//                     struct: {
//                         num1: 'u32'
//                     }
//                 }
//             }
//         }
//     ]
// };

interface ProgramAccount {
  pubkey: PublicKey;
  lamports: number;
  dataLength: number;
  data: number[];
}

export default function App() {
  const programId = new PublicKey("9aN1KaEMbCcTbJrbjuzhZRkfwtnMibPdga8agbuFtm85");
  const [num, setNum] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingAccounts, setIsLoadingAccounts] = useState(false);
  const [programAccounts, setProgramAccounts] = useState<ProgramAccount[]>([]);
  const [operation, setOperation] = useState<'increment' | 'decrement'>('increment');
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'checking'>('checking');
  const [status, setStatus] = useState<{
    type: 'success' | 'error' | 'info' | null;
    message: string;
  }>({ type: null, message: '' });
  const [txSignature, setTxSignature] = useState<string>('');
  const [txHistory, setTxHistory] = useState<string[]>([]);

  // Check connection status on mount
  useEffect(() => {
    checkConnection();
  }, []);

  // Auto-refresh accounts
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (autoRefresh) {
      interval = setInterval(() => {
        getAllProgramAccounts();
      }, 5000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh]);

  const checkConnection = async () => {
    try {
      const connection = new Connection("http://127.0.0.1:8899", "confirmed");
      await connection.getVersion();
      setConnectionStatus('connected');
    } catch (error) {
      setConnectionStatus('disconnected');
    }
  };

  const getAllProgramAccounts = async () => {
    setIsLoadingAccounts(true);
    try {
      const connection = new Connection("http://127.0.0.1:8899", "confirmed");
      const accounts = await connection.getProgramAccounts(programId);
      
      const formattedAccounts: ProgramAccount[] = accounts.map((account) => ({
        pubkey: account.pubkey,
        lamports: account.account.lamports / LAMPORTS_PER_SOL,
        dataLength: account.account.data.length,
        data: Array.from(account.account.data)
      }));
      
      setProgramAccounts(formattedAccounts);
    } catch (error) {
      console.error('Failed to fetch program accounts:', error);
      setStatus({
        type: 'error',
        message: `Failed to fetch accounts: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    } finally {
      setIsLoadingAccounts(false);
    }
  };

  const handleClick = async () => {
    if (!num || isNaN(Number(num))) {
      setStatus({
        type: 'error',
        message: 'Please enter a valid number'
      });
      return;
    }

    setIsLoading(true);
    setStatus({ type: 'info', message: 'Initiating transaction...' });
    
    try {
      // Generate admin account
      const adminAccount = Keypair.generate();
      const programId = new PublicKey("9aN1KaEMbCcTbJrbjuzhZRkfwtnMibPdga8agbuFtm85");
      const existingAccount = new PublicKey("2EHv98XGXqQ4oNWtvXvvyFXkbQaVtyxKeR6Nt1U7eiSp");
      
      setStatus({ type: 'info', message: 'Serializing data...' });
      const schema = InstructionSchema;
      const instructionData = operation === 'increment' 
        ? { Increment: { num1: Number(num) } }
        : { Decrement: { num1: Number(num) } };
        
      const dataSerialize = borsh.serialize(schema, instructionData);
      // Connect to local Solana cluster
      const connection = new Connection("http://127.0.0.1:8899", "confirmed");
      
      setStatus({ type: 'info', message: 'Requesting airdrop...' });
      const airdropTxn = await connection.requestAirdrop(
        adminAccount.publicKey, 
        LAMPORTS_PER_SOL * 20
      );
      const restxn = await connection.confirmTransaction(airdropTxn);
      console.log(restxn);
      setStatus({ type: 'info', message: 'Creating transaction instruction...' });
      const itxn = new TransactionInstruction({
        keys: [
          {
            pubkey: existingAccount,
            isSigner: false,
            isWritable: true
          }
        ],
        programId: programId,
        data: Buffer.from(dataSerialize)
      });

      const createTxn = new Transaction();
      createTxn.add(itxn);

      setStatus({ type: 'info', message: 'Sending transaction...' });
      const signature = await connection.sendTransaction(createTxn, [adminAccount]);
      await connection.confirmTransaction(signature);

      setTxSignature(signature);
      setTxHistory(prev => [signature, ...prev.slice(0, 9)]); // Keep last 10 transactions
      setStatus({
        type: 'success',
        message: `${operation === 'increment' ? 'Increment' : 'Decrement'} transaction completed successfully!`
      });
      
      // Refresh accounts after successful transaction
      await getAllProgramAccounts();
      
    } catch (error) {
      console.error('Transaction failed:', error);
      setStatus({
        type: 'error',
        message: `Transaction failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setStatus({
      type: 'success',
      message: 'Copied to clipboard!'
    });
    setTimeout(() => setStatus({ type: null, message: '' }), 2000);
  };

  const quickSetNumbers = [1, 5, 10, 25, 50, 100];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-gradient-to-br from-purple-500/10 to-transparent rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-gradient-to-tl from-blue-500/10 to-transparent rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      <div className="relative z-10 container mx-auto max-w-7xl p-6">
        {/* Enhanced Header */}
        <div className="text-center mb-12 pt-8">
          <div className="flex items-center justify-center mb-6">
            <div className="p-3 bg-gradient-to-r from-purple-500 to-blue-500 rounded-2xl mr-4">
              <Wallet className="h-10 w-10 text-white" />
            </div>
            <div>
              <h1 className="text-5xl font-bold bg-gradient-to-r from-white via-purple-200 to-blue-200 bg-clip-text text-transparent">
                Solana Counter DApp
              </h1>
              <div className="flex items-center justify-center mt-2 space-x-2">
                <Badge variant={connectionStatus === 'connected' ? 'default' : 'destructive'} className="text-xs">
                  {connectionStatus === 'connected' ? '🟢 Connected' : connectionStatus === 'disconnected' ? '🔴 Disconnected' : '🟡 Checking...'}
                </Badge>
                <Badge variant="outline" className="text-purple-200 border-purple-400">
                  <Activity className="h-3 w-3 mr-1" />
                  {programAccounts.length} Accounts
                </Badge>
              </div>
            </div>
          </div>
          <p className="text-purple-200 text-xl max-w-2xl mx-auto leading-relaxed">
            Interact with smart contracts on the Solana blockchain with an intuitive interface
          </p>
        </div>

        <Tabs defaultValue="transaction" className="space-y-8">
          <div className="flex justify-center">
            <TabsList className="grid w-full max-w-md grid-cols-2 bg-white/10 backdrop-blur-lg border border-purple-500/20">
              <TabsTrigger value="transaction" className="data-[state=active]:bg-purple-500 data-[state=active]:text-white">
                <Send className="h-4 w-4 mr-2" />
                Transaction
              </TabsTrigger>
              <TabsTrigger value="accounts" className="data-[state=active]:bg-purple-500 data-[state=active]:text-white">
                <Database className="h-4 w-4 mr-2" />
                Accounts
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="transaction" className="space-y-6">
            <div className="grid lg:grid-cols-3 gap-6">
              {/* Main Transaction Card */}
              <Card className="lg:col-span-2 bg-white/5 backdrop-blur-xl border border-purple-500/20 shadow-2xl hover:shadow-purple-500/10 transition-all duration-300">
                <CardHeader className="text-center pb-6">
                  <CardTitle className="text-3xl text-white flex items-center justify-center mb-2">
                    <div className="p-2 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg mr-3">
                      {operation === 'increment' ? <Plus className="h-6 w-6" /> : <Minus className="h-6 w-6" />}
                    </div>
                    {operation === 'increment' ? 'Increment' : 'Decrement'} Counter
                  </CardTitle>
                  <CardDescription className="text-purple-200 text-lg">
                    Choose an operation and enter a number to modify the blockchain state
                  </CardDescription>
                </CardHeader>
                
                <CardContent className="space-y-8">
                  {/* Operation Toggle */}
                  <div className="space-y-3">
                    <Label className="text-white font-medium text-lg">Operation Type</Label>
                    <div className="grid grid-cols-2 gap-3">
                      <Button
                        onClick={() => setOperation('increment')}
                        variant={operation === 'increment' ? 'default' : 'outline'}
                        className={`h-12 text-lg font-semibold transition-all duration-200 ${
                          operation === 'increment' 
                            ? 'bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white shadow-lg' 
                            : 'bg-white/10 border-green-400/30 text-green-300 hover:bg-green-500/20'
                        }`}
                      >
                        <Plus className="h-5 w-5 mr-2" />
                        Increment
                      </Button>
                      <Button
                        onClick={() => setOperation('decrement')}
                        variant={operation === 'decrement' ? 'default' : 'outline'}
                        className={`h-12 text-lg font-semibold transition-all duration-200 ${
                          operation === 'decrement' 
                            ? 'bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600 text-white shadow-lg' 
                            : 'bg-white/10 border-red-400/30 text-red-300 hover:bg-red-500/20'
                        }`}
                      >
                        <Minus className="h-5 w-5 mr-2" />
                        Decrement
                      </Button>
                    </div>
                  </div>

                  {/* Quick Number Selection */}
                  <div className="space-y-3">
                    <Label className="text-white font-medium">Quick Select</Label>
                    <div className="grid grid-cols-6 gap-2">
                      {quickSetNumbers.map((quickNum) => (
                        <Button
                          key={quickNum}
                          onClick={() => setNum(quickNum.toString())}
                          variant="outline"
                          size="sm"
                          className="bg-white/10 border-purple-400/30 text-purple-200 hover:bg-purple-500/20 hover:border-purple-400 transition-all duration-200"
                        >
                          {quickNum}
                        </Button>
                      ))}
                    </div>
                  </div>

                  {/* Number Input */}
                  <div className="space-y-3">
                    <Label htmlFor="number-input" className="text-white font-medium text-lg">
                      Number Value
                    </Label>
                    <div className="relative">
                      <Input
                        id="number-input"
                        type="number"
                        placeholder="Enter any number..."
                        value={num}
                        onChange={(e) => setNum(e.target.value)}
                        className="h-14 text-lg bg-white/10 border-purple-400/30 text-white placeholder:text-purple-300 focus:border-purple-400 focus:ring-purple-400 focus:ring-2 transition-all duration-200"
                        disabled={isLoading}
                      />
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                        <TrendingUp className="h-5 w-5 text-purple-400" />
                      </div>
                    </div>
                  </div>

                  {/* Status Alert */}
                  {status.type && (
                    <Alert className={`border-2 transition-all duration-300 ${
                      status.type === 'success' ? 'bg-green-500/10 border-green-400/50 text-green-100' :
                      status.type === 'error' ? 'bg-red-500/10 border-red-400/50 text-red-100' :
                      'bg-blue-500/10 border-blue-400/50 text-blue-100'
                    }`}>
                      <div className="flex items-center">
                        {status.type === 'success' && <CheckCircle className="h-5 w-5 mr-2" />}
                        {status.type === 'error' && <AlertCircle className="h-5 w-5 mr-2" />}
                        {status.type === 'info' && <Loader2 className="h-5 w-5 mr-2 animate-spin" />}
                        <AlertDescription className="font-medium text-lg">
                          {status.message}
                        </AlertDescription>
                      </div>
                    </Alert>
                  )}

                  {/* Submit Button */}
                  <Button 
                    onClick={handleClick}
                    disabled={isLoading || !num || connectionStatus !== 'connected'}
                    className="w-full h-16 text-xl font-bold bg-gradient-to-r from-purple-600 via-purple-500 to-blue-600 hover:from-purple-700 hover:via-purple-600 hover:to-blue-700 text-white transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-xl hover:shadow-purple-500/25"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-3 h-6 w-6 animate-spin" />
                        Processing {operation}...
                      </>
                    ) : (
                      <>
                        {operation === 'increment' ? <Plus className="mr-3 h-6 w-6" /> : <Minus className="mr-3 h-6 w-6" />}
                        Execute {operation === 'increment' ? 'Increment' : 'Decrement'}
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>

              {/* Transaction Info & History Card */}
              <Card className="bg-white/5 backdrop-blur-xl border border-purple-500/20 shadow-2xl">
                <CardHeader>
                  <CardTitle className="text-xl text-white flex items-center">
                    <Settings className="h-5 w-5 mr-2" />
                    Controls & Info
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Auto-refresh toggle */}
                  <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-purple-400/20">
                    <Label className="text-white font-medium">Auto Refresh</Label>
                    <Button
                      onClick={() => setAutoRefresh(!autoRefresh)}
                      variant={autoRefresh ? 'default' : 'outline'}
                      size="sm"
                      className={autoRefresh ? 'bg-green-500 hover:bg-green-600' : 'border-purple-400/30 text-purple-200'}
                    >
                      <RefreshCw className={`h-4 w-4 mr-1 ${autoRefresh ? 'animate-spin' : ''}`} />
                      {autoRefresh ? 'ON' : 'OFF'}
                    </Button>
                  </div>

                  {/* Current Transaction Signature */}
                  {txSignature && (
                    <div className="space-y-2">
                      <Label className="text-white font-medium">Latest Transaction</Label>
                      <div className="bg-black/30 p-3 rounded-lg border border-purple-400/30">
                        <div className="flex items-center justify-between mb-2">
                          <code className="text-green-300 text-xs font-mono break-all">
                            {txSignature.slice(0, 20)}...{txSignature.slice(-20)}
                          </code>
                          <div className="flex space-x-1">
                            <Button
                              onClick={() => copyToClipboard(txSignature)}
                              size="sm"
                              variant="ghost"
                              className="h-6 w-6 p-0 text-purple-300 hover:text-white"
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                            <Button
                              onClick={() => window.open(`https://explorer.solana.com/tx/${txSignature}?cluster=custom&customUrl=http://127.0.0.1:8899`, '_blank')}
                              size="sm"
                              variant="ghost"
                              className="h-6 w-6 p-0 text-purple-300 hover:text-white"
                            >
                              <ExternalLink className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Transaction History */}
                  {txHistory.length > 0 && (
                    <div className="space-y-2">
                      <Label className="text-white font-medium">Recent Transactions</Label>
                      <div className="space-y-1 max-h-40 overflow-y-auto">
                        {txHistory.slice(0, 5).map((tx, i) => (
                          <div key={tx} className="bg-black/20 p-2 rounded border border-purple-400/20">
                            <code className="text-purple-300 text-xs">
                              {i + 1}. {tx.slice(0, 16)}...{tx.slice(-16)}
                            </code>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Connection Info */}
                  <div className="pt-4 border-t border-purple-400/20 space-y-2">
                    <div className="text-center">
                      <p className="text-purple-200 text-sm">
                        Network: <span className="text-white font-mono">Localhost</span>
                      </p>
                      <p className="text-purple-200 text-sm mt-1">
                        Program: <span className="text-white font-mono text-xs">{programId.toString().slice(0, 20)}...</span>
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="accounts" className="space-y-6">
            {/* Enhanced Program Accounts Card */}
            <Card className="bg-white/5 backdrop-blur-xl border border-purple-500/20 shadow-2xl">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-3xl text-white flex items-center">
                      <Database className="h-8 w-8 mr-3" />
                      Program Accounts
                      <Badge variant="outline" className="ml-3 text-purple-200 border-purple-400">
                        {programAccounts.length} found
                      </Badge>
                    </CardTitle>
                    <CardDescription className="text-purple-200 text-lg mt-2">
                      All accounts owned by the smart contract program
                    </CardDescription>
                  </div>
                  <Button
                    onClick={getAllProgramAccounts}
                    disabled={isLoadingAccounts}
                    className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white shadow-lg"
                  >
                    {isLoadingAccounts ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <RefreshCw className="h-5 w-5" />
                    )}
                    <span className="ml-2">Refresh</span>
                  </Button>
                </div>
              </CardHeader>
              
              <CardContent>
                {programAccounts.length === 0 ? (
                  <div className="text-center py-16">
                    <Database className="h-16 w-16 text-purple-400 mx-auto mb-6" />
                    <h3 className="text-2xl font-semibold text-white mb-2">No Accounts Found</h3>
                    <p className="text-purple-300 text-lg mb-6">
                      Click refresh to load program accounts or create your first transaction
                    </p>
                    <Button 
                      onClick={getAllProgramAccounts}
                      className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600"
                    >
                      <RefreshCw className="h-5 w-5 mr-2" />
                      Load Accounts
                    </Button>
                  </div>
                ) : (
                  <div className="grid gap-6">
                    {programAccounts.map((account, i) => (
                      <Card key={account.pubkey.toString()} className="bg-gradient-to-r from-white/5 to-white/10 border border-purple-400/30 hover:border-purple-400/50 transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/10">
                        <CardContent className="p-6">
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center">
                              <div className="p-2 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg mr-3">
                                <Wallet className="h-5 w-5 text-white" />
                              </div>
                              <h3 className="text-xl font-semibold text-white">Account {i + 1}</h3>
                            </div>
                            <Badge variant="outline" className="text-green-300 border-green-400 bg-green-500/10">
                              {account.lamports.toFixed(6)} SOL
                            </Badge>
                          </div>
                          
                          <div className="space-y-4">
                            <div>
                              <Label className="text-purple-200 text-sm font-medium">Public Key</Label>
                              <div className="flex items-center mt-1">
                                <code className="flex-1 text-white text-sm font-mono bg-black/40 p-3 rounded-lg border border-purple-400/20">
                                  {account.pubkey.toBase58()}
                                </code>
                                <Button
                                  onClick={() => copyToClipboard(account.pubkey.toBase58())}
                                  size="sm"
                                  variant="ghost"
                                  className="ml-2 text-purple-300 hover:text-white"
                                >
                                  <Copy className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                            
                            <div className="grid grid-cols-3 gap-4">
                              <div className="bg-white/5 p-3 rounded-lg border border-purple-400/20">
                                <Label className="text-purple-200 text-xs">Data Length</Label>
                                <p className="text-white text-lg font-semibold">{account.dataLength} bytes</p>
                              </div>
                              <div className="bg-white/5 p-3 rounded-lg border border-purple-400/20">
                                <Label className="text-purple-200 text-xs">Lamports</Label>
                                <p className="text-white text-lg font-semibold">{Math.round(account.lamports * LAMPORTS_PER_SOL).toLocaleString()}</p>
                              </div>
                              <div className="bg-white/5 p-3 rounded-lg border border-purple-400/20">
                                <Label className="text-purple-200 text-xs">Rent Status</Label>
                                <p className="text-green-300 text-lg font-semibold">Exempt</p>
                              </div>
                            </div>
                            
                            {account.data.length > 0 && (
                              <div>
                                <Label className="text-purple-200 text-sm font-medium">Raw Data (first 32 bytes)</Label>
                                <code className="block text-orange-300 text-sm font-mono bg-black/40 p-3 rounded-lg mt-1 border border-purple-400/20">
                                  [{account.data.slice(0, 32).join(', ')}{account.data.length > 32 ? '...' : ''}]
                                </code>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Enhanced Footer */}
        <div className="text-center mt-12 pb-8">
          <div className="bg-white/5 backdrop-blur-lg border border-purple-500/20 rounded-2xl p-6 max-w-2xl mx-auto">
            <p className="text-purple-200 text-lg mb-2">
              🚀 Make sure your local Solana validator is running on port 8899
            </p>
            <p className="text-purple-300 text-sm">
              Built with ❤️ for the Solana ecosystem
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}