import { useScroll } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useState, useEffect } from "react";
//import { motion } from "framer-motion";
import { motion } from "motion/react";
import { config } from "../config";
import { atom, useAtom } from "jotai";
//import { useSectionState } from "../States";
import { useSection } from "../States";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useMobile } from "../hooks/useMobile";
import { FaEnvelope, FaPhone, FaLinkedin, FaGithub } from "react-icons/fa";

gsap.registerPlugin(ScrollTrigger);

// Global state, which we can use/call from any component globally (used for Projects section)
export const projectAtom = atom(config.projects[0]);

export const Interface = () => {
  const { isMobile } = useMobile();
  // State to know if user has already scrolled (initially false)
  const [hasScrolled, setHasScrolled] = useState(false);
  const scrollData = useScroll();
  // State to track skills visibility
  //const [showSkills, setShowSkills] = useState(false); // State to track skills visibility
  // State to track projects visibility
  // State to track contact visibility

  // Global vars
  const [_project, setProject] = useAtom(projectAtom);

  // Update hasScrolled state if user has scrolled using scroll data
  useFrame(() => {
    setHasScrolled(scrollData.offset > 0); // Won't cause re-renders unless it's true which will happen once
  });
  /*
  useEffect(() => {
    if (section === 'skills') {
      setShowSkills(true);  // Show skills HTML when 3D skills section is visible
    } else {
      setShowSkills(false); // Hide skills HTML when 3D skills section is not visible
    }
  }, [section]); // Re-run whenever section changes
  */
  /*
  // Use useEffect to trigger GSAP scroll-based animations for HTML content
  useEffect(() => {
    // Set ScrollTrigger on the 3D scene for skills section
    ScrollTrigger.create({
      trigger: ".skills_3d_scene", // Target your 3D scene for the skills section
      start: "top bottom", // Start when the top of the 3D scene reaches the bottom of the viewport
      end: "bottom top", // End when the bottom of the 3D scene reaches the top of the viewport
      onEnter: () => setShowSkills(true), // Show skills when the 3D scene enters the viewport
      onLeave: () => setShowSkills(false), // Hide skills if the 3D scene leaves the viewport
      scrub: true, // Ensures smooth scrolling sync
    });
    */
  /*
    gsap.fromTo(
      ".skills_div",
      { opacity: 0, y: 100 }, // element starts higher up for "slide-in transition"
      {
        opacity: showSkills ? 1 : 0, // Show skills only when showSkills is true
        y: showSkills ? 0 : 100, // Slide up only when showSkills is true
        scrollTrigger: {
          trigger: ".skills_div",
          start: "top 80%", // ensure smooth transition
          scrub: true,
        },
      }
    );
    
  }, [scrollData.offset, showSkills]); // Re-run this effect every time scroll offset or showSkills state changes
*/
  return (
    // Div Class "interface" will act as main HTML container
    <div className="interface">
      <div className="sections">
        {/* HOME */}
        <section className="section section--bottom">
          {/* Animation to tell user they can scroll if they haven't already */}
          <div className="element-container">
            <motion.div
              className="scroll-down"
              initial="visible"
              animate={{ opacity: hasScrolled ? 0 : 1 }}
            >
              <motion.div
                className="scroll-down__wheel"
                initial={{ translateY: 0 }}
                animate={{ translateY: 4 }}
                transition={{
                  duration: 0.4,
                  repeatDelay: 0.5,
                  repeatType: "reverse",
                  repeat: Infinity,
                }}
              ></motion.div>
            </motion.div>
          </div>
        </section>
        {/* SKILLS */}
        <section className="section section--right mobile--section--left mobile--section--bottom">
          {/* Create smooth "fade in" effect using "visible" tag */}
          <motion.div
            className="skills_div"
            whileInView={"visible"}
            variants={{ visible: { opacity: 1 } }}
            initial={{ opacity: 0 }}
            viewport={{ margin: isMobile ? "-70% 0px 0px 0px" : undefined }}
          >
            {/* Map to render 1 skill per object, wrapped in motion divs so we can animate them individually */}
            {/* .map method creates a new array by applying a function to each element of an existing array */}
            {/* add different delays based on the index of the skill so they float in 1 by 1 */}
            {config.skills.map((skill, index) => (
              <motion.div
                key={skill.name}
                className="skill"
                initial={{ opacity: 0 }}
                variants={{ visible: { opacity: 1 } }}
                transition={{ duration: 2, delay: isMobile ? 0 : index * 0.6 }}
              >
                <div className="skill_label">
                  <img
                    className="skill_label_image"
                    src={skill.icon}
                    alt={skill.name}
                  />
                  <h2 className="skill_label_name">{skill.name}</h2>
                </div>
                <p className="skill_label_details">{skill.details}</p>
                <div className="skill_level">
                  <motion.div
                    className="skill_level_bar"
                    initial={{ width: 0 }}
                    variants={{ visible: { width: `${skill.level}%` } }}
                    transition={{ duration: 1, delay: index * 0.62 }}
                  ></motion.div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </section>
        {/* EXPERIENCE */}
        <section className="section section--left mobile--section--bottom"></section>
        {/* PROJECTS */}
        <section className="section section--left mobile--section--bottom">
          <motion.div
            className="projects_div"
            whileInView={"visible"}
            initial={{ opacity: 0 }}
            variants={{ visible: { opacity: 1 } }}
            viewport={{ margin: isMobile ? "-70% 0px 0px 0px" : undefined }}
          >
            {/* Render div for each project using map */}
            {config.projects.map((project, index) => (
              <motion.div
                key={project.name}
                className="project"
                initial={{ opacity: 0 }}
                onMouseEnter={() => setProject(project)}
                variants={{ visible: { opacity: 1 } }}
                transition={{ duration: 1, delay: isMobile ? 0 : index * 0.62 }}
              >
                <a
                  href={project.link}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <img
                    className="project_image"
                    src={project.image}
                    alt={project.name}
                  />
                  <div className="project_details">
                    <h2 className="project_details_name">{project.name}</h2>
                  </div>
                </a>
              </motion.div>
            ))}
          </motion.div>
        </section>
        {/* CONTACT */}
        <section className="section section--right mobile--section--bottom">
          <motion.div
            className="contact"
            whileInView={"visible"}
            initial={{ opacity: 0 }}
            variants={{ visible: { opacity: 1 } }}
          >
            {/* Left Side: Contact Info List */}
            <div className="contact_div">
              <ul className="contact_ul">
                <li className="contact_li">
                  <FaEnvelope className="contact_icon" size={24} />
                  <span className="break-all">vlmarrocco@gmail.com</span>
                </li>
                <li className="contact_li">
                  <FaPhone className="contact_icon" size={24} />
                  <span>+1 (905) 243-2030</span>
                </li>
                <li className="contact_li">
                  <FaLinkedin className="contact_icon" size={24} />
                  <a
                    href="https://www.linkedin.com/in/vlmarrocco/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:underline"
                  >
                    linkedin.com/in/vlmarrocco
                  </a>
                </li>
                <li className="contact_li">
                  <FaGithub className="contact_icon" size={24} />
                  <a
                    href="https://github.com/vxron"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:underline"
                  >
                    github.com/vxron
                  </a>
                </li>
              </ul>
            </div>
          </motion.div>
        </section>
      </div>
    </div>
  );
};
