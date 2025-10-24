"use client";

import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Link from "next/link";
import Image from "next/image";
import { ShoppingCart } from "lucide-react";
import { Listing } from "@/lib/types";

interface ListingCardProps {
  listing: Listing;
  usdPrice?: number;
}

export default function ListingCard({ listing, usdPrice }: ListingCardProps) {
  const usdValue = usdPrice ? (listing.price * usdPrice).toFixed(2) : null;

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow duration-300">
      <Link href={`/listing/${listing.id}`}>
        <div className="relative h-48 w-full overflow-hidden bg-muted">
          {listing.imageUrl ? (
            <Image
              src={listing.imageUrl}
              alt={listing.title}
              fill
              className="object-cover hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              No Image
            </div>
          )}
          <Badge className="absolute top-2 right-2">{listing.category}</Badge>
        </div>
      </Link>

      <CardContent className="p-4">
        <Link href={`/listing/${listing.id}`}>
          <h3 className="font-semibold text-lg mb-2 hover:text-primary transition-colors line-clamp-1">
            {listing.title}
          </h3>
        </Link>
        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
          {listing.description || "No description available"}
        </p>

        <div className="flex items-center justify-between">
          <div>
            <div className="text-2xl font-bold text-primary">
              {listing.price} ALGO
            </div>
            {usdValue && (
              <div className="text-sm text-muted-foreground">
                ≈ ${usdValue} USD
              </div>
            )}
          </div>
        </div>
      </CardContent>

      <CardFooter className="p-4 pt-0 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Avatar className="h-6 w-6">
            <AvatarImage src={listing.seller?.avatarUrl ?? ""} alt="Seller" />
            <AvatarFallback>
              {listing.seller?.username?.[0]?.toUpperCase() ?? "U"}
            </AvatarFallback>
          </Avatar>
          <span className="text-sm text-muted-foreground">
            {listing.seller?.username ?? "Anonymous"}
          </span>
        </div>

        <Button asChild size="sm">
          <Link href={`/listing/${listing.id}`}>
            <ShoppingCart className="h-4 w-4 mr-1" />
            View
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
