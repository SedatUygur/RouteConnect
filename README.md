<!-- Improved compatibility of back to top link: See: https://github.com/SedatUygur/RouteConnect/pull/73 -->

<a id="readme-top"></a>

<!-- PROJECT SHIELDS -->
<!--
*** I'm using markdown "reference style" links for readability.
*** Reference links are enclosed in brackets [ ] instead of parentheses ( ).
*** See the bottom of this document for the declaration of the reference variables
*** for contributors-url, forks-url, etc. This is an optional, concise syntax you may use.
*** https://www.markdownguide.org/basic-syntax/#reference-style-links
-->

[![Contributors][contributors-shield]][contributors-url]
[![Forks][forks-shield]][forks-url]
[![Stargazers][stars-shield]][stars-url]
[![Issues][issues-shield]][issues-url]
[![MIT License][license-shield]][license-url]
[![LinkedIn][linkedin-shield]][linkedin-url]

<!-- PROJECT LOGO -->
<br />
<div align="center">
  <h3 align="center">RouteConnect</h3>

  <p align="center">
    RouteConnect is a full stack app takes trip details and shows route instructions, draws ELD logs
    <br />
    <a href="https://github.com/SedatUygur/RouteConnect/README.md"><strong>Explore the docs</strong></a>
    <br />
    <br />
    <a href="https://github.com/SedatUygur/RouteConnect/issues/new?labels=bug&template=bug-report---.md">Report Bug</a>
    ·
    <a href="https://github.com/SedatUygur/RouteConnect/issues/new?labels=enhancement&template=feature-request---.md">Request Feature</a>
  </p>
</div>

<!-- TABLE OF CONTENTS -->
<details open>
  <summary>Table of Contents</summary>
  <ol>
    <li>
      <a href="#about-the-project">About The Project</a>
      <ul>
        <li><a href="#built-with">Built With</a></li>
      </ul>
    </li>
    <li>
      <a href="#getting-started">Getting Started</a>
      <ul>
        <li><a href="#prerequisites">Prerequisites</a></li>
        <li><a href="#installation">Installation</a></li>
      </ul>
    </li>
    <li><a href="#features">Features</a></li>
    <li><a href="#technologies">Technologies</a></li>
    <li><a href="#contributing">Contributing</a></li>
    <li><a href="#license">License</a></li>
    <li><a href="#contact">Contact</a></li>
  </ol>
</details>

<!-- ABOUT THE PROJECT -->

## About The Project

RouteConnect is an app that takes trip details as inputs and outputs route instructions and draws ELD logs as outputs.

- The app that takes in the following inputs:

    - Current location

    - Pickup location

    - Dropoff location

    - Current Cycle Used (Hrs)

- Outputs

    - Map showing route and information regarding stops and rests

    - Daily Log Sheets filled out, draw on the log and fill out the sheet (multiple log sheets will be needed for longer trips)

<p align="right">(<a href="#readme-top">back to top</a>)</p>

### Built With

[![Python][Python-logo]][Python]
[![Django][Django-logo]][Django]
[![TypeScript][TypeScript-logo]][TypeScript]
[![Nextjs][Nextjs-logo]][Nextjs]
[![React][React-logo]][React]
[![JavaScript][JavaScript-logo]][JavaScript]
[![PostgreSQL][PostgreSQL-logo]][PostgreSQL]
[![Docker][Docker-logo]][Docker]

<p align="right">(<a href="#readme-top">back to top</a>)</p>

<!-- GETTING STARTED -->

## Getting Started

To get a local copy up and running follow these simple steps.

### Prerequisites

- Node.js and npm installed on your system

- Docker installed on your system

- PostgreSQL database set up and running

### Installation

1. **Download or clone my repository:**

   ```sh
   git clone https://github.com/SedatUygur/RouteConnect.git
   cd RouteConnect
   ```

2. **Docker Compose:**

   If you prefer to use Docker, you can build and run the application using Docker Compose. Make sure Docker and Docker Compose are installed on your machine. Then run:

   ```bash
   docker-compose up --build
   ```

   This command will build the Docker images and start the containers.

3. **If Docker Compose does not work, you can install the required dependencies for backend:**

   ```sh
   pip install -r requirements.txt
   ```

4. **Run the application:**

   ```bash
   python manage.py makemigrations
   python manage.py migrate
   python manage.py runserver
   ```

5. **Access the backend application:**

   Open your browser and navigate to `http://localhost:8000`.

6. **You can install the required dependencies for frontend:**

   ```sh
   npm install
   ```

7. **Run the application:**

   ```bash
   npm run dev
   ```

8. **Access the backend application:**

   Open your browser and navigate to `http://localhost:3000`.

<!-- FEATURES -->

## Features

- [x] Map showing route and information regarding stops and rests
- [x] Find and use a free map API
- [x] Daily Log Sheets filled out
   - [x] Draw on the log and fill out the sheet
   - [ ] Multiple log sheets will be needed for longer trips
- [x] Real geocoding of start and destination addresses.
- [x] Determination of time zones via timezonefinder. The driver's effective timezone is either provided (driver_timezone) or determined from the start address.
- [x] A rolling 70-hour/8-day calculation using actual on-duty period timestamps.
- [x] Daily limits: maximum 11 hours of driving within a 14-hour on-duty window.
- [x] A 30-minute break after 8 cumulative driving hours.
- [x] A sleeper berth option: if enabled, an off-duty reset can be achieved instead of a fixed 10-hour block.
    - [x] 7+3 hour combination (7 consecutive hours in a sleeper plus 3 additional hours off duty)
- [x] Pickup and drop-off each require 1 hour.
- [x] Fuel stops are inserted every 1000 miles.
- [x] If the rolling total on-duty hours (across actual timestamps) reaches 70 hours in the preceding 8 days, a full 34-hour restart is enforced.
- [x] When crossing time zones, the final dropoff time is converted to the destination's local time.

See the [open issues](https://github.com/SedatUygur/RouteConnect/issues) for a full list of proposed features (and known issues).

<p align="right">(<a href="#readme-top">back to top</a>)</p>

<!-- TECHNOLOGIES -->

## Technologies

- [Axios](https://axios-http.com/)
- [Django](https://www.djangoproject.com/)
- [django-cors-headers](https://pypi.org/project/django-cors-headers/)
- [Django REST framework](https://www.django-rest-framework.org/)
- [ESLint](https://eslint.org/)
- [husky](https://github.com/typicode/husky)
- [leaflet](https://leafletjs.com/)
- [lint-staged](https://github.com/lint-staged/lint-staged)
- [Next.js](https://nextjs.org/)
- [PostCSS](https://postcss.org/)
- [Prettier](https://prettier.io/)
- [Psycopg2](https://www.psycopg.org/)
- [python-dotenv](https://pypi.org/project/python-dotenv/)
- [pytz](https://pythonhosted.org/pytz/)
- [React](https://react.dev/)
- [React Leaflet](https://react-leaflet.js.org/)
- [React-pdf](https://react-pdf.org/)
- [Requests](https://requests.readthedocs.io/en/latest/)
- [Tailwind](https://tailwindcss.com/)
- [timezonefinder](https://github.com/jannikmi/timezonefinder)
- [TypeScript](https://www.typescriptlang.org/)

<p align="right">(<a href="#readme-top">back to top</a>)</p>

<!-- CONTRIBUTING -->

## Contributing

You can follow the contribution guidelines to contribute. We have issue templates for bug and feature requests.

Contributions are what make the open source community such an amazing place to learn, inspire, and create. Any contributions you make are **greatly appreciated**.

If you have a suggestion that would make this better, please fork the repo and create a pull request. You can also simply open an issue with the tag "enhancement".

Don't forget to give the project a star! Thanks again!

1. Fork the Project

2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)

3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)

4. Push to the Branch (`git push origin feature/AmazingFeature`)

5. Open a Pull Request

### Top contributors:

<a href="https://github.com/SedatUygur/RouteConnect/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=SedatUygur/RouteConnect" alt="contrib.rocks image" />
</a>

<p align="right">(<a href="#readme-top">back to top</a>)</p>

<!-- LICENSE -->

## License

Distributed under the MIT License. See `LICENSE.txt` for more information.

<p align="right">(<a href="#readme-top">back to top</a>)</p>

<!-- CONTACT -->

## Contact

Sedat Uygur - [@sedat-can-uygur](https://www.linkedin.com/in/sedat-can-uygur) - sedat.uygur@outlook.com

Project Link: [https://github.com/SedatUygur/RouteConnect](https://github.com/SedatUygur/RouteConnect)

<p align="right">(<a href="#readme-top">back to top</a>)</p>

<!-- MARKDOWN LINKS & IMAGES -->
<!-- https://www.markdownguide.org/basic-syntax/#reference-style-links -->

[contributors-shield]: https://img.shields.io/github/contributors/SedatUygur/RouteConnect.svg?style=for-the-badge
[contributors-url]: https://github.com/SedatUygur/RouteConnect/graphs/contributors
[forks-shield]: https://img.shields.io/github/forks/SedatUygur/RouteConnect.svg?style=for-the-badge
[forks-url]: https://github.com/SedatUygur/RouteConnect/network/members
[stars-shield]: https://img.shields.io/github/stars/SedatUygur/RouteConnect.svg?style=for-the-badge
[stars-url]: https://github.com/SedatUygur/RouteConnect/stargazers
[issues-shield]: https://img.shields.io/github/issues/SedatUygur/RouteConnect.svg?style=for-the-badge
[issues-url]: https://github.com/SedatUygur/RouteConnect/issues
[license-shield]: https://img.shields.io/github/license/SedatUygur/RouteConnect.svg?style=for-the-badge
[license-url]: https://github.com/SedatUygur/RouteConnect/blob/main/LICENSE.txt
[linkedin-shield]: https://img.shields.io/badge/-LinkedIn-black.svg?style=for-the-badge&logo=linkedin&colorB=555
[linkedin-url]: https://linkedin.com/in/sedat-can-uygur
[product-screenshot]: images/screenshot.png
[JavaScript-logo]: https://static-00.iconduck.com/assets.00/javascript-icon-256x256-0ybhyms4.png
[JavaScript]: https://www.javascript.com/
[Nextjs-logo]: https://gitlab.com/uploads/-/system/project/avatar/18080731/nextjs.png
[Nextjs]: https://nextjs.org/
[Nodejs-logo]: https://global.synologydownload.com/download/Package/img/Node.js_v16/16.20.2-2014/thumb_256.png
[Nodejs]: https://nodejs.org/en
[React-logo]: https://static-00.iconduck.com/assets.00/react-icon-256x256-2yyldh38.png
[React]: https://react.dev/
[TypeScript-logo]: https://ms-vscode.gallerycdn.vsassets.io/extensions/ms-vscode/vscode-typescript-next/5.8.20241203/1733271143236/Microsoft.VisualStudio.Services.Icons.Default
[TypeScript]: https://www.typescriptlang.org/
[Python-logo]: https://technostacks.com/wp-content/uploads/2021/01/python-2038870-1720083.png
[Python]: https://www.python.org/
[Django-logo]: https://images.crunchbase.com/image/upload/c_pad,h_256,w_256,f_auto,q_auto:eco,dpr_1/wuizmqbrtwtzfc58h1qv
[Django]: https://www.djangoproject.com/
[PostgreSQL-logo]: https://cdn.prod.website-files.com/6452937893cd845b6181c39e/65d2bddcf3c28f44ab327f9c_PostreSQL_icon.png
[PostgreSQL]: https://www.postgresql.org/
[Docker-logo]: https://images.crunchbase.com/image/upload/c_pad,h_256,w_256,f_auto,q_auto:eco,dpr_1/ywjqppks5ffcnbfjuttq
[Docker]: https://www.docker.com/