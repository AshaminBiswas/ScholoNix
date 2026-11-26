import React from "react";
import Image from "next/image";
import Link from "next/link";

export interface BrandLogoProps {
  /**
   * "full" = horizontal logo (icon + "ScholoNix" text)
   * "icon" = book mark icon only
   * "stacked" = vertical layout (icon on top, text below)
   */
  variant?: "full" | "icon" | "stacked";
  className?: string;
  imgClassName?: string;
  href?: string;
  asLink?: boolean;
  priority?: boolean;
  alt?: string;
}

export function BrandLogo({
  variant = "full",
  className = "",
  imgClassName = "",
  href = "/",
  asLink = true,
  priority = true,
  alt = "ScholoNix",
}: BrandLogoProps) {
  let src = "/images/logo-clean.png";
  let width = 158;
  let height = 36;
  let defaultImgClass = "h-8 sm:h-9 w-auto object-contain";

  if (variant === "icon") {
    src = "/images/logo-icon-clean.png";
    width = 36;
    height = 36;
    defaultImgClass = "h-8 w-8 sm:h-9 sm:w-9 object-contain";
  } else if (variant === "stacked") {
    src = "/images/logo-stacked-clean.png";
    width = 90;
    height = 90;
    defaultImgClass = "h-16 w-auto object-contain";
  }

  const imageElement = (
    <>
      <Image
        src={src}
        alt={alt}
        width={width}
        height={height}
        priority={priority}
        style={{ width: "auto", height: "auto" }}
        className={`${defaultImgClass} dark:brightness-110 dark:drop-shadow-[0_1px_10px_rgba(139,92,246,0.28)] ${imgClassName}`.trim()}
      />
      <span className="sr-only">School Management SaaS</span>
    </>
  );

  if (!asLink) {
    return <div className={`inline-flex items-center ${className}`.trim()}>{imageElement}</div>;
  }

  return (
    <Link
      href={href}
      className={`inline-flex items-center transition-transform hover:opacity-95 ${className}`.trim()}
      aria-label="ScholoNix Home"
    >
      {imageElement}
    </Link>
  );
}
