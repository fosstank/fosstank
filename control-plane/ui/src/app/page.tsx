'use client';
import HLSPlayer from "@/components/hls-player";
import { Stream, TypedPocketBase } from "@/lib/pocketbase";
import PocketBase from 'pocketbase';
import { useEffect, useState } from "react";

const pb = new PocketBase('http://127.0.0.1:8090') as TypedPocketBase;

export default function Home() {
  const [streams, setStreams] = useState<Stream[]>([]);
  useEffect(() => {
    pb.collection("streams").getFullList().then(streams => setStreams(streams))
  })

  return (
    <div className="grid grid-cols-1 m-4">
      <h1 className="text-4xl text-center">Fosstank Control Plane</h1>
      <div className="grid grid-cols-3 gap-4">
        {streams.map(stream => (
          <HLSPlayer key={stream.id} className="w-full" src={`/streams/${stream.id}.m3u8`}></HLSPlayer>
        ))}
      </div>
    </div>
  );
}
