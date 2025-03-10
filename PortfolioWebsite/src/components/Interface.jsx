import { useScroll } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useState } from "react";
//import { motion } from "framer-motion";
import { motion } from "motion/react";
import { config } from "../config";
import { atom, useAtom } from "jotai";
//import { useSectionState } from "../States";
import { useSection } from "../States";

// Global state, which we can use/call from any component globally (used for Projects section)
export const projectAtom = atom(config.projects[0]);

export const Interface = () => {
  // State to know if user has already scrolled (initially false)
  const [hasScrolled, setHasScrolled] = useState(false);
  const scrollData = useScroll();

  // Global vars
  const [_project, setProject] = useAtom(projectAtom);

  // Update hasScrolled state if user has scrolled using scroll data
  useFrame(() => {
    setHasScrolled(scrollData.offset > 0); // Won't cause re-renders unless it's true which will happen once
  });

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
            whileInView={"visible"}
            initial={{ opacity: 0 }}
            variants={{ visible: { opacity: 1 } }}
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
        <section className="section section--middle">EXPERIENCE</section>
        {/* PROJECTS */}
        <section className="section section--left">
          <motion.div
            className="projects_div"
            whileInView={"visible"}
            initial={{ opacity: 0 }}
            variants={{ visible: { opacity: 1 } }}
          >
            {/* Render div for each project using map */}
            {config.projects.map((project, index) => (
              <motion.div
                key={project.name}
                className="project"
                initial={{ opacity: 0 }}
                onMouseEnter={() => setProject(project)}
                variants={{ visible: { opacity: 1 } }}
                transition={{ duration: 1, delay: index * 0.62 }}
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
