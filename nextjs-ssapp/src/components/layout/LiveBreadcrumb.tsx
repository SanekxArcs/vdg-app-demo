"use client";

import { usePathname } from "next/navigation";
import { JSX } from "react";
import { useState, useEffect } from "react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

// LiveBreadcrumb dynamically displays the previous and current route.
export function LiveBreadcrumb(): JSX.Element {
  // Get the current pathname from Next.js; default to an empty string if null.
  const pathname = usePathname() || "";

  // State to store the previous and current paths.
  const [prevPath, setPrevPath] = useState<string | null>(null);
  const [currentPath, setCurrentPath] = useState<string>(pathname);

  // Update the previous path when the pathname changes.
  useEffect(() => {
    if (pathname !== currentPath) {
      setPrevPath(currentPath);
      setCurrentPath(pathname);
    }
  }, [pathname, currentPath]);

  // Format a path string for display.
  const formatPath = (path: string | null): string => {
    // Return "Home" if the path is null or empty.
    if (!path || path === "/") return "Home";
    // Remove the leading slash and capitalize the first letter.
    const formatted = path.replace(/^\//, "");
    return formatted.charAt(0).toUpperCase() + formatted.slice(1);
  };

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {prevPath && (
          <>
            <BreadcrumbItem className="hidden md:block">
              <BreadcrumbLink href={prevPath}>
                {formatPath(prevPath)}
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator className="hidden md:block" />
          </>
        )}
        <BreadcrumbItem>
          <BreadcrumbPage>{formatPath(currentPath)}</BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  );
}
