"use client"

import type React from "react"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Car, LayoutDashboard, Menu, ShieldAlert } from "lucide-react"
import { cn } from "@/lib/utils"

import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
} from "@/components/ui/sidebar"

export function MainLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  const navItems = [
    {
      title: "Fila de placas",
      href: "/live",
      icon: Car,
      active: pathname === "/live",
    },
    {
      title: "Revisao portaria",
      href: "/review",
      icon: ShieldAlert,
      active: pathname === "/review",
    },
    {
      title: "Dashboard",
      href: "/dashboard",
      icon: LayoutDashboard,
      active: pathname === "/dashboard",
    },
  ]

  return (
    <SidebarProvider>
      <div className="flex min-h-screen">
        <Sidebar className="hidden md:flex">
          <SidebarHeader className="flex items-center px-4 py-2">
            <h2 className="text-2xl font-bold">Automatic Gate</h2>
          </SidebarHeader>
          <SidebarContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    isActive={item.active}
                    size="lg"
                    className="text-base [&>svg]:size-5"
                  >
                    <Link href={item.href}>
                      <item.icon className="h-5 w-5" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarContent>
          <SidebarFooter className="px-4 py-2">
            <p className="text-sm text-muted-foreground">© 2026 Automatic Gate UI</p>
          </SidebarFooter>
        </Sidebar>

        <Sheet>
          <SheetTrigger asChild className="md:hidden absolute top-4 left-4">
            <Button variant="outline" size="icon">
              <Menu className="h-5 w-5" />
              <span className="sr-only">Toggle menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64 p-0">
            <div className="flex flex-col h-full">
              <div className="p-4 border-b">
                <h2 className="text-2xl font-bold">Automatic Gate</h2>
              </div>
              <div className="flex-1 overflow-auto py-2">
                <nav className="grid gap-1 px-2">
                  {navItems.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        "flex items-center gap-3 rounded-md px-3 py-2.5 text-base font-medium",
                        item.active ? "bg-primary text-primary-foreground" : "hover:bg-muted",
                      )}
                    >
                      <item.icon className="h-5 w-5" />
                      {item.title}
                    </Link>
                  ))}
                </nav>
              </div>
              <div className="p-4 border-t">
                <p className="text-sm text-muted-foreground">© 2026 Automatic Gate UI</p>
              </div>
            </div>
          </SheetContent>
        </Sheet>

        <div className="flex-1 md:ml-64">
          <div className="md:hidden h-16" />
          {children}
        </div>
      </div>
    </SidebarProvider>
  )
}
