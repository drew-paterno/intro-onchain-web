'use client';

import {
  ConnectWallet,
  Wallet,
  WalletDropdown,
  WalletDropdownLink,
  WalletDropdownDisconnect,
} from '@coinbase/onchainkit/wallet';
import {
  Address,
  Avatar,
  Name,
  Identity,
  EthBalance,
} from '@coinbase/onchainkit/identity';
import { Transaction, TransactionButton, TransactionSponsor, TransactionStatus, TransactionStatusAction, TransactionStatusLabel } from "@coinbase/onchainkit/transaction"
import { encodeFunctionData, Hex } from 'viem';
import { AttendanceAbi, attendenceContract } from '@/app/lib/Attendance';
import { useAccount, useChainId, useReadContract, useSwitchChain } from 'wagmi';
import { baseSepolia } from 'viem/chains';
import { parseSession } from '@/app/sessions/route';
import { useEffect } from 'react';

export default function App({ params }: {params: {sessionId: string}}) {
    const account = useAccount()
    const {data: totalSessions, isLoading} = useReadContract({
        abi: AttendanceAbi, 
        address: attendenceContract, 
        functionName: "totalSessions"
    })
    const {data: sessionRaw} = useReadContract({
        abi: AttendanceAbi,
        address: attendenceContract,
        functionName: "sessions",
        args: [BigInt(params.sessionId)]
    })
    const {data: hasAttended} = useReadContract({
        abi: AttendanceAbi, 
        address: attendenceContract, 
        functionName: "hasAttended", 
        args: [BigInt(params.sessionId), account.address as Hex]
    })
    const attendSessionCalls = [{
        to: attendenceContract, 
        data: encodeFunctionData({
            abi: AttendanceAbi, 
            functionName: "attendSession", 
            args: [BigInt(params.sessionId)]
        })
    }]

    const chainId = useChainId()
    const {switchChain} = useSwitchChain()
    useEffect(() => {
        if (chainId && chainId !== baseSepolia.id) {
            switchChain({ chainId: baseSepolia.id })
        }
    }, [chainId, switchChain])

    const session = parseSession(sessionRaw)
    console.log({session})

    return isLoading ? (
        <></>
    ) : parseInt(params.sessionId) >= (totalSessions ?? 0) ? (
        <div className='flex flex-col text-center justify-center min-h-screen'>Session does not exist.</div>
    ) : (
        <div className="flex flex-col items-center justify-center min-h-screen font-sans dark:bg-background dark:text-white bg-white text-black">
            <div className='flex flex-col space-y-4 mb-12'>
                <div className='text-2xl'>Session #{params.sessionId}</div>
                <div className='text-2xl'>Total attended: {session?.totalAttended}</div>
            </div>
            {!account.address ? (
                <Wallet>
                    <ConnectWallet>
                    <Avatar className="h-6 w-6" />
                    <Name />
                    </ConnectWallet>
                </Wallet>
            ) : (
                <>
                    <div className='absolute top-4 right-4'>
                        <Wallet>
                            <ConnectWallet>
                                <Avatar className="h-6 w-6" />
                                <Name />
                            </ConnectWallet>
                            <WalletDropdown>
                                <Identity className="px-4 pt-3 pb-2" hasCopyAddressOnClick>
                                    <Avatar />
                                    <Name />
                                    <Address />
                                    <EthBalance />
                                </Identity>
                                <WalletDropdownLink
                                    icon="wallet"
                                    href="https://keys.coinbase.com"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    >
                                    Wallet
                                </WalletDropdownLink>
                                <WalletDropdownDisconnect />
                            </WalletDropdown>
                        </Wallet>
                    </div>
                    <div className='w-1/4'>
                    {!hasAttended ? (
                        <Transaction calls={attendSessionCalls}>
                            <TransactionButton text={"Attend"} />
                            <TransactionSponsor />
                            <TransactionStatus>
                                <TransactionStatusLabel />
                                <TransactionStatusAction />
                            </TransactionStatus>
                        </Transaction>  
                    ) : (
                        <div className='text-center'>You have already attended this session.</div>
                    )}
                    </div>
                </>
            )}
        </div>
    );
}