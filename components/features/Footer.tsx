import React from "react";
import { Facebook, Instagram, Twitter } from "lucide-react";

export const Footer = () => {
  return (
    <footer className="footer sm:footer-horizontal bg-base-200 text-base-content justify-evenly gap-12 p-10  ">
      <aside className="max-w-sm flex flex-col justify-end   ">
        <a className="text-3xl text-primary font-bold  ">Pulse Clinic</a>
        <p className="w-full  text-base text-base-content ">
          Pulse serves as the heartbeat of community health, committed to
          offering comprehensive and quality care. We are here to support the
          well-being of every neighbor in our community.
        </p>
      </aside>
      <div className="flex gap-8  ">
        <nav className="flex flex-col  ">
          <h6 className="footer-title text-lg text-primary">Overview</h6>
          <a className="link link-hover text-base text-base-content hover:text-primary">
            Medicines
          </a>
          <a className="link link-hover text-base text-base-content hover:text-primary">
            Healthcare Devices
          </a>
          <a className="link link-hover text-base text-base-content hover:text-primary">
            Health Progress
          </a>
        </nav>
        <nav className="flex flex-col  ">
          <h6 className="footer-title text-lg text-primary">Company</h6>
          <a className="link link-hover text-base text-base-content hover:text-primary">
            Home
          </a>
          <a className="link link-hover text-base text-base-content hover:text-primary">
            About us
          </a>
          <a className="link link-hover text-base text-base-content hover:text-primary">
            Services
          </a>
        </nav>
        <nav className="flex flex-col  ">
          <h6 className="footer-title text-lg text-primary ">Explore</h6>
          <a className="link link-hover text-base text-base-content hover:text-primary">
            Blogs & Feeds
          </a>
          <a className="link link-hover text-base text-base-content hover:text-primary">
            Privacy policy
          </a>
          <a className="link link-hover text-base text-base-content hover:text-primary">
            Cookie policy
          </a>
        </nav>
        <nav className="flex flex-col  ">
          <h6 className="footer-title text-lg text-primary">Social Media</h6>
          <div className="flex justify-evenly">
            <a className="link link-hover text-base-content hover:text-accent">
              <Facebook size={20} />
            </a>
            <a className="link link-hover text-base-content hover:text-accent">
              <Instagram size={20} />
            </a>
            <a className="link link-hover text-base-content hover:text-accent">
              <Twitter size={20} />
            </a>
          </div>
        </nav>
      </div>
    </footer>
  );
};
