import { useScroll } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useState, useEffect, useRef } from "react";
//import { motion } from "framer-motion";
import { motion } from "motion/react";
import { config } from "../config";
import { atom, useAtom } from "jotai";
//import { useSectionState } from "../States";
import { useSection } from "../States";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

// Global state, which we can use/call from any component globally (used for Projects section)
export const projectAtom = atom(config.projects[0]);

export const Interface = () => {
  // Global vars
  // State to know if user has already scrolled (initially false)
  const [hasScrolled, setHasScrolled] = useState(false);
  const scrollData = useScroll();
  // State to track skills visibility
  //const [showSkills, setShowSkills] = useState(false); // State to track skills visibility
  // State to track projects visibility
  // State to track contact visibility
  const [_project, setProject] = useAtom(projectAtom);

  // Map section ranges from config.sections to ensure HTML elements sync with 3D scene
  const sectionRanges = {
    home: [0.0, 0.25],
    skills: [0.25, 0.4],
    experience: [0.4, 0.65],
    projects: [0.65, 0.85],
    contact: [0.85, 1.0],
  }; // scroll offset is a number from 0 to 1

  const [visibleSection, setVisibleSection] = useState(null);
  // Keep track of skill bar animations
  const [shouldAnimateSkills, setShouldAnimateSkills] = useState(false);
  const prevOffset = useRef(scrollData.offset);
  const prevSection = useRef(null);

  useFrame(() => {
    const offset = scrollData.offset;
    // Update hasScrolled once when scrolling begins
    if (!hasScrolled && offset > 0) {
      setHasScrolled(true);
    }
    const direction = offset > prevOffset.current ? "forward" : "backward";
    // Determine which section we're in based on offset and scroll offset ranges defined above
    let current = null;
    for (const [sectionName, [start, end]] of Object.entries(sectionRanges)) {
      if (offset >= start && offset < end) {
        current = sectionName;
        break;
      }
    }

    if (!current) return; // If no section matches, exit early

    const prev = prevSection.current;

    // ✅ Animate only when going forward from home → skills
    if (current === "skills" && prev === "home" && direction === "forward") {
      // Flip animate flag to re-trigger animation
      setShouldAnimateSkills(false);
      requestAnimationFrame(() => {
        setShouldAnimateSkills(true);
      });
    }

    setVisibleSection(current);
    prevSection.current = current;
    prevOffset.current = offset;
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
        <section className="section section--right">
          {/* Create smooth "fade in" effect using "visible" tag */}
          <motion.div
            className="skills_div"
            //whileInView={"visible"}
            //variants={{ visible: { opacity: 1 } }}
            initial={{ opacity: 0 }}
            animate={{
              opacity: visibleSection === "skills" ? 1 : 0,
              pointerEvents: visibleSection === "skills" ? "auto" : "none", // optional
            }}
            transition={{ duration: 0.6 }}
          >
            {/* Map to render 1 skill per object, wrapped in motion divs so we can animate them individually */}
            {/* .map method creates a new array by applying a function to each element of an existing array */}
            {/* add different delays based on the index of the skill so they float in 1 by 1 */}
            {config.skills.map((skill, index) => (
              <motion.div
                key={skill.name}
                className="skill"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                //variants={{ visible: { opacity: 1 } }}
                transition={{ duration: 2, delay: index * 0.6 }}
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
                    // whenever hasAnimatedSkills changes from false → true, the key also changes. React sees it as a new element and fully re-renders it, causing the initial → animate transition to run cleanly from 0 to full.
                    // okay for performance because its a single animated bar, not a lot of expensive computation
                    key={
                      shouldAnimateSkills
                        ? `animate-${skill.name}`
                        : `static-${skill.name}`
                    }
                    className="skill_level_bar"
                    initial={{ width: 0 }}
                    animate={{
                      width: shouldAnimateSkills ? `${skill.level}%` : 0,
                    }}
                    //variants={{ visible: { width: `${skill.level}%` } }}
                    transition={{
                      duration: shouldAnimateSkills ? 1 : 0,
                      delay: shouldAnimateSkills ? index * 0.62 : 0,
                    }}
                  ></motion.div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </section>
        {/* EXPERIENCE */}
        <section className="section section--left">EXPERIENCE</section>
        {/* PROJECTS */}
        <section className="section section--left">
          <motion.div
            className="projects_div"
            //whileInView={"visible"}
            initial={{ opacity: 0 }}
            //variants={{ visible: { opacity: 1 } }}
            animate={{
              opacity: visibleSection === "projects" ? 1 : 0,
              pointerEvents: visibleSection === "projects" ? "auto" : "none",
            }}
            transition={{ duration: 0.7 }}
          >
            {/* Render div for each project using map */}
            {config.projects.map((project, index) => (
              <motion.div
                key={project.name}
                className="project"
                initial={{ opacity: 0 }}
                onMouseEnter={() => setProject(project)}
                animate={{ opacity: visibleSection === "projects" ? 1 : 0 }}
                transition={{
                  duration: 1,
                  delay: visibleSection === "projects" ? index * 0.62 : 0,
                }}
              >
                <a href={project.link} target="_blank">
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
        <section className="section section--left">
          <motion.div
            className="contact"
            whileInView={"visible"}
            initial={{ opacity: 0 }}
            variants={{ visible: { opacity: 1 } }}
          >
            <h1 className="contact_name">{config.contact.name}</h1>
            <div className="contact_socials">
              <p className="contact_socials_phone">
                {config.contact.socials.phone}
              </p>
              <p className="contact_socials_mail">
                {config.contact.socials.mail}
              </p>
              <a href={config.contact.socials.linkedin} target="_blank">
                <img
                  className="contact_socials_icon"
                  src="icons/linkedin.png"
                  alt="LinkedIn"
                />
              </a>
            </div>
          </motion.div>
        </section>
      </div>
    </div>
  );
};
