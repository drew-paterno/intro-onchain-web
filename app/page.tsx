'use client';

import { Address, Avatar, EthBalance, Identity, Name } from "@coinbase/onchainkit/identity";
import { ConnectWallet, Wallet, WalletDropdown, WalletDropdownDisconnect, WalletDropdownLink } from "@coinbase/onchainkit/wallet";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useAccount, useReadContract } from 'wagmi';
import { AttendanceAbi, attendanceContract } from '@/app/lib/Attendance';

async function fetchSessions() {
  const response = await fetch("/sessions");
  if (!response.ok) {
    throw new Error("Failed to fetch sessions");
  }
  return response.json();
}

export default function App() {
  const account = useAccount()

  const { data, isLoading } = useQuery({
    queryKey: ["sessions"],
    queryFn: fetchSessions,
  });

  // state for querying totalAttendence
  const { data: totalSessions } = useReadContract({
      abi: AttendanceAbi, 
      address: attendanceContract, 
      functionName: "totalSessions"
  })

  return isLoading ? (<></>) : (
    <div className="flex flex-col items-center justify-center min-h-screen font-sans dark:bg-background dark:text-white bg-white text-black">
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
      {!data?.sessions?.length ? (
        // If no sessions have been created, display message
        <div className="text-center">No sessions created. <br /> Call POST /sessions or transact directly onchain. </div>
      ) : (
        // If sessions have been created, display list of sessions
        <>
        
          <div className="text-center">There are {totalSessions?.toString() ?? '0'} total sessions.</div><br/>
          <ul className="w-1/4 text-center flex flex-col space-y-4">
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {data?.sessions?.map((session: any) => (
              <Link key={session.sessionId} href={`/session/${session.sessionId}`} className="hover:underline">Session #{session.sessionId}</Link>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}