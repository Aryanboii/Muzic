import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { GetVideoDetails } from "youtube-search-api";
import { prismaClient } from "@/app/lib/db";

const YT_REGEX = new RegExp("^https:\\/\\/www\\.youtube\\.com\\/watch\\?v=([\\w-]{11})");

const CreateStreamSchema = z.object({
  creatorId: z.string(),
  url: z.string(),
});

export async function POST(req: NextRequest) {
  try {
    const data = CreateStreamSchema.parse(await req.json());
    const match = data.url.match(YT_REGEX);
    const extractedId = match ? match[1] : null;

    if (!extractedId) {
      return NextResponse.json(
        { message: "Invalid YouTube URL format" },
        { status: 411 }
      );
    }

    const res = await GetVideoDetails(extractedId);
    console.log(res.title);
    console.log(res.thumbnail.thumbnails);
   const thumbnails =  res.thumbnail.thumbnails;
   thumbnails.sort((a: {width: number}, b: {width: number}) => a.width < b.width ? -1 : 1)


    await prismaClient.stream.create({
      data: {
        UserID: data.creatorId,
        url: data.url,
        extractedId,
        type: "Youtube",
        title: res.title ?? "Cant find video",
        smallImg: (thumbnails.length > 1 ? thumbnails[thumbnails.length - 2].url : thumbnails[thumbnails.length - 1].url) ?? "https://www.universalmusic.ca/wp-content/uploads/sites/2543/2025/07/Artwork-98.png",
        bigImg: thumbnails[thumbnails.length - 1].url ?? "https://www.universalmusic.ca/wp-content/uploads/sites/2543/2025/07/Artwork-98.png"

      },
    });

    return NextResponse.json({ message: "Stream created" });

  } catch (e) {
    console.log(e);
    return NextResponse.json(
      { message: "Error while adding a stream" },
      { status: 411 }
    );
  }
}

export async function GET(req: NextRequest) {
  const creatorId = req.nextUrl.searchParams.get("creatorId");

  const streams = await prismaClient.stream.findMany({
    where: {
      UserID: creatorId ?? "",
    },
  });

  return NextResponse.json({ streams });
}


