import React from "react";
import { Facebook, Instagram, Twitter } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

export const Footer = () => {
  return (
    <footer className="footer sm:footer-horizontal text-black justify-evenly gap-12 p-10 bg-white">
      <aside className="max-w-sm flex flex-col justify-end   ">
       <Link href="/" className="hover:opacity-80 transition-opacity">
          <Image
            src="/pulseclinic.png"
            alt="Pulse Clinic Logo"
            width={300}
            height={95}
            className="h-auto"
          />
        </Link>
        <p className="w-full  text-base text-black ">
          Pulse serves as the heartbeat of community health, committed to
          offering comprehensive and quality care. We are here to support the
          well-being of every neighbor in our community.
        </p>
      </aside>
      <div className="flex gap-8  ">
        <nav className="flex flex-col  ">
          <h6 className="footer-title text-lg text-primary">Overview</h6>
          <a className="link link-hover text-base text-black hover:text-primary">
            Medicines
          </a>
          <a className="link link-hover text-base text-black hover:text-primary">
            Healthcare Devices
          </a>
          <a className="link link-hover text-base text-black hover:text-primary">
            Health Progress
          </a>
        </nav>
        <nav className="flex flex-col  ">
          <h6 className="footer-title text-lg text-primary">Company</h6>
          <a className="link link-hover text-base text-black hover:text-primary">
            Home
          </a>
          <a className="link link-hover text-base text-black hover:text-primary">
            About us
          </a>
          <a className="link link-hover text-base text-black hover:text-primary">
            Services
          </a>
        </nav>
        <nav className="flex flex-col  ">
          <h6 className="footer-title text-lg text-primary ">Explore</h6>
          <a className="link link-hover text-base text-black hover:text-primary">
            Blogs & Feeds
          </a>
          <a className="link link-hover text-base text-black hover:text-primary">
            Privacy policy
          </a>
          <a className="link link-hover text-base text-black hover:text-primary">
            Cookie policy
          </a>
        </nav>
        <nav className="flex flex-col  ">
          <h6 className="footer-title text-lg text-primary">Social Media</h6>
          <div className="flex justify-evenly">
            <a className="link link-hover text-black hover:text-accent">
              <Facebook size={20} />
            </a>
            <a className="link link-hover text-black hover:text-accent">
              <Instagram size={20} />
            </a>
            <a className="link link-hover text-black hover:text-accent">
              <Twitter size={20} />
            </a>
          </div>
        </nav>
      </div>
    </footer>
  );
};
