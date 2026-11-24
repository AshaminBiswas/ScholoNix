"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  FileText,
  HelpCircle,
  MessageCircleQuestion,
  BookOpen,
  ChevronDown,
} from "lucide-react";

export interface ResourceItem {
  id: string;
  title: string;
  description: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

export const RESOURCE_ITEMS: ResourceItem[] = [
  {
    id: "blog",
    title: "Blog",
    description: "Insights, tips and best practices",
    href: "/blog",
    icon: FileText,
  },
  {
    id: "help",
    title: "Help Center",
    description: "Get answers to common questions",
    href: "/help",
    icon: HelpCircle,
  },
  {
    id: "faqs",
    title: "FAQs",
    description: "Quick answers about our platform",
    href: "/faqs",
    icon: MessageCircleQuestion,
  },
  {
    id: "guides",
    title: "Guides",
    description: "Step-by-step guides and resources",
    href: "/guides",
    icon: BookOpen,
  },
];

interface ResourcesDropdownProps {
  className?: string;
  active?: boolean;
  onItemClick?: () => void;
}

export function ResourcesDropdown({ className = "", active = false, onItemClick }: ResourcesDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastMouseEnterRef = useRef<number>(0);

  const clearCloseTimeout = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const handleMouseEnter = useCallback(() => {
    clearCloseTimeout();
    lastMouseEnterRef.current = Date.now();
    setIsOpen(true);
  }, [clearCloseTimeout]);

  const handleMouseLeave = useCallback(() => {
    clearCloseTimeout();
    timeoutRef.current = setTimeout(() => {
      setIsOpen(false);
    }, 150);
  }, [clearCloseTimeout]);

  const handleToggle = useCallback(() => {
    clearCloseTimeout();
    const timeSinceEnter = Date.now() - lastMouseEnterRef.current;
    if (timeSinceEnter < 300) {
      setIsOpen(true);
    } else {
      setIsOpen((prev) => !prev);
    }
  }, [clearCloseTimeout]);

  const handleItemSelect = useCallback(() => {
    setIsOpen(false);
    if (onItemClick) {
      onItemClick();
    }
  }, [onItemClick]);

  // Click outside listener
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
      clearCloseTimeout();
    };
  }, [isOpen, clearCloseTimeout]);

  return (
    <div
      ref={containerRef}
      className={`relative inline-block ${className}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Trigger Button */}
      <button
        type="button"
        onClick={handleToggle}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-label="Toggle resources menu"
        className={
          active
            ? `flex cursor-pointer items-center gap-1 rounded-full bg-[#8B5CF6] px-3.5 py-1 text-xs font-bold text-white shadow-xs transition-colors hover:bg-[#7C3AED] outline-none focus-visible:ring-2 focus-visible:ring-[#663CF6] focus-visible:ring-offset-2`
            : `group flex cursor-pointer items-center gap-1 text-sm font-semibold transition-colors duration-200 outline-none focus-visible:ring-2 focus-visible:ring-[#663CF6] focus-visible:ring-offset-2 rounded-md ${
                isOpen ? "text-[#663CF6]" : "text-[#4D5072] hover:text-[#663CF6]"
              }`
        }
      >
        <span>Resources</span>
        <ChevronDown
          className={`h-3.5 w-3.5 transition-transform duration-200 ${
            active
              ? `text-white ${isOpen ? "rotate-180" : ""}`
              : `${isOpen ? "rotate-180 text-[#663CF6]" : "text-[#4D5072] group-hover:text-[#663CF6]"}`
          }`}
        />
      </button>

      {/* Floating Dropdown Card */}
      <div
        role="menu"
        aria-orientation="vertical"
        className={`absolute left-1/2 top-full z-50 mt-2.5 w-80 -translate-x-1/2 rounded-[20px] border border-[#D6DBF0]/90 bg-white/98 p-2.5 shadow-[0_18px_45px_rgba(24,18,77,0.14)] backdrop-blur-md transition-all duration-200 ease-out before:absolute before:-top-3 before:left-0 before:h-3 before:w-full before:content-[''] ${
          isOpen
            ? "visible translate-y-0 opacity-100 pointer-events-auto"
            : "invisible translate-y-2 opacity-0 pointer-events-none"
        }`}
      >
        <div className="flex flex-col space-y-1">
          {RESOURCE_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.id}
                href={item.href}
                role="menuitem"
                onClick={handleItemSelect}
                className="group/item flex items-center gap-3.5 rounded-[14px] p-2.5 text-left transition-all duration-150 hover:bg-[#F6F5FD]"
              >
                {/* Purple Icon Badge */}
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] bg-[#EDE7FF] text-[#663CF6] ring-1 ring-[#D4C4FE]/60 transition-transform duration-200 group-hover/item:scale-105 group-hover/item:bg-[#E4DAFF]">
                  <Icon className="h-5 w-5" />
                </div>

                {/* Text Content */}
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-[#08093B] transition-colors group-hover/item:text-[#663CF6]">
                    {item.title}
                  </span>
                  <span className="text-xs font-normal text-[#5A5E7A] leading-relaxed">
                    {item.description}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}

interface MobileResourcesMenuProps {
  onItemClick: () => void;
}

export function MobileResourcesMenu({ onItemClick }: MobileResourcesMenuProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="flex flex-col">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between rounded-[10px] px-3 py-2 text-sm font-semibold text-[#1B1D45] transition hover:bg-[#F2EEFD] hover:text-[#663CF6]"
        aria-expanded={isOpen}
      >
        <span>Resources</span>
        <ChevronDown
          className={`h-4 w-4 transition-transform duration-200 ${
            isOpen ? "rotate-180 text-[#663CF6]" : "text-[#4D5072]"
          }`}
        />
      </button>

      {isOpen && (
        <div className="mt-1 ml-2 flex flex-col space-y-1 border-l-2 border-[#E0D7FE] pl-2">
          {RESOURCE_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.id}
                href={item.href}
                onClick={onItemClick}
                className="group flex items-center gap-3 rounded-[12px] p-2 transition hover:bg-[#F6F5FD]"
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] bg-[#EDE7FF] text-[#663CF6]">
                  <Icon className="h-4 w-4" />
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-[#08093B] group-hover:text-[#663CF6]">
                    {item.title}
                  </span>
                  <span className="text-[11px] text-[#6B7280]">
                    {item.description}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
