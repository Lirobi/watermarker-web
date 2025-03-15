"use client";

import {
  Navbar as HeroUINavbar,
  NavbarContent,
  NavbarMenu,
  NavbarMenuToggle,
  NavbarBrand,
  NavbarItem,
  NavbarMenuItem,
} from "@heroui/navbar";
import { Button } from "@heroui/button";
import { Link } from "@heroui/link";
import { link as linkStyles } from "@heroui/theme";
import NextLink from "next/link";
import clsx from "clsx";
import { useSession, signOut } from "next-auth/react";
import { Avatar } from "@heroui/avatar";
import {
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
} from "@heroui/dropdown";

import { siteConfig } from "@/config/site";
import { Logo } from "@/components/icons";
import { useEffect, useState } from "react";

export const Navbar = () => {
  const { data: session, status } = useSession();
  const isAdmin = session?.user?.role === "ADMIN";
  const isAuthenticated = status === "authenticated";
  const isLoading = status === "loading";
  const [hasPaid, setHasPaid] = useState(false);
  useEffect(() => {
    if (isAuthenticated) {
      const fetchPaymentStatus = async () => {
        const res = await fetch(`/api/user/payment-status`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        });
        const data = await res.json();
        setHasPaid(data.hasPaid);
      }
      fetchPaymentStatus();
    }
  }, [isAuthenticated, session]);

  return (
    <HeroUINavbar maxWidth="xl" position="sticky">
      <NavbarContent className="basis-1/5 sm:basis-full" justify="start">
        <NavbarBrand as="li" className="gap-3 max-w-fit">
          <NextLink className="flex justify-start items-center gap-1" href="/">
            <Logo />
            <p className="font-bold text-inherit">Watermarker</p>
          </NextLink>
        </NavbarBrand>
        <ul className="hidden lg:flex gap-4 justify-start ml-2">
          {siteConfig.navItems.map((item) => (
            (item.label === "Watermarker" && !hasPaid) ? null : (
              <NavbarItem key={item.href}>
                <NextLink
                  className={clsx(
                    linkStyles({ color: "foreground" }),
                    "data-[active=true]:text-primary data-[active=true]:font-medium",
                  )}
                  color="foreground"
                  href={item.href}
                >
                  {item.label}
                </NextLink>
              </NavbarItem>
            )
          ))}
          {isAdmin && (
            <NavbarItem>
              <NextLink
                className={clsx(
                  linkStyles({ color: "foreground" }),
                  "data-[active=true]:text-primary data-[active=true]:font-medium",
                )}
                color="foreground"
                href="/admin"
              >
                Admin
              </NextLink>
            </NavbarItem>
          )}
        </ul>
      </NavbarContent>

      <NavbarContent
        className="hidden sm:flex basis-1/5 sm:basis-full"
        justify="end"
      >
        {isLoading ? (
          <NavbarItem>
            <div className="h-8 w-8 animate-pulse rounded-full bg-default-200"></div>
          </NavbarItem>
        ) : isAuthenticated ? (
          <NavbarItem>
            <Dropdown placement="bottom-end">
              <DropdownTrigger>
                <Avatar
                  as="button"
                  className="transition-transform"
                  color="primary"
                  name={session?.user?.name || "User"}
                  size="sm"
                  src={session?.user?.image || ""}
                />
              </DropdownTrigger>
              <DropdownMenu aria-label="Profile Actions" variant="flat">
                <DropdownItem key="profile" className="h-14 gap-2">
                  <p className="font-semibold">Signed in as</p>
                  <p className="font-semibold">{session?.user?.email}</p>
                </DropdownItem>
                <DropdownItem key="dashboard">
                  <NextLink href="/dashboard">Watermarker</NextLink>
                </DropdownItem>
                <DropdownItem key="pricing">
                  <NextLink href="/pricing">Pricing</NextLink>
                </DropdownItem>
                {isAdmin ? (
                  <DropdownItem key="admin">
                    <NextLink href="/admin">Admin Panel</NextLink>
                  </DropdownItem>
                ) : null}
                <DropdownItem key="logout" color="danger" onClick={async () => {
                  try {
                    await signOut({ redirect: false });
                    window.location.href = "/";
                  } catch (error) {
                    console.error("Error signing out:", error);
                    window.location.href = "/";
                  }
                }}>
                  Log Out
                </DropdownItem>
              </DropdownMenu>
            </Dropdown>
          </NavbarItem>
        ) : (
          <NavbarItem>
            <Button
              as={NextLink}
              color="primary"
              href="/auth/signin"
              variant="flat"
            >
              Sign In
            </Button>
          </NavbarItem>
        )}
      </NavbarContent>

      <NavbarContent className="sm:hidden basis-1 pl-4" justify="end">
        <NavbarMenuToggle />
      </NavbarContent>

      <NavbarMenu>
        <div className="mx-4 mt-2 flex flex-col gap-2">
          {isAuthenticated ? (
            <>
              {siteConfig.navMenuItems.map((item, index) => (
                <NavbarMenuItem key={`${item}-${index}`}>
                  <Link
                    color={
                      index === 2
                        ? "primary"
                        : index === siteConfig.navMenuItems.length - 1
                          ? "danger"
                          : "foreground"
                    }
                    href={item.href}
                    size="lg"
                  >
                    {item.label}
                  </Link>
                </NavbarMenuItem>
              ))}
              {isAdmin ? (
                <NavbarMenuItem>
                  <NextLink
                    className={linkStyles({ color: "primary" })}
                    href="/admin"
                  >
                    Admin Panel
                  </NextLink>
                </NavbarMenuItem>
              ) : null}
              <NavbarMenuItem>
                <Button
                  color="danger"
                  onClick={async () => {
                    try {
                      await signOut({ redirect: false });
                      window.location.href = "/";
                    } catch (error) {
                      console.error("Error signing out:", error);
                      window.location.href = "/";
                    }
                  }}
                  variant="flat"
                  className="w-full justify-start"
                >
                  Log Out
                </Button>
              </NavbarMenuItem>
            </>
          ) : (
            <NavbarMenuItem>
              <Button
                as={NextLink}
                color="primary"
                href="/auth/signin"
                variant="flat"
                className="w-full justify-start"
              >
                Sign In
              </Button>
            </NavbarMenuItem>
          )}
        </div>
      </NavbarMenu>
    </HeroUINavbar>
  );
};
