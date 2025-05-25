# DrawMyRoom

DrawMyRoom is a Home Assistant dashboard extension that gives you a smarter and more visual way to manage your home. No need for any fancy 3D modeling skills or floorplans.

You simply draw your room or house (floor by floor), add your smart devices, and you're done. DrawMyRoom also visualizes your electricity usage, allowing you to compare your consumption with others in your neighborhood, encouraging energy awareness and a greener lifestyle.

> 🔗 Powered by [Home Assistant](https://github.com/home-assistant)


## ✨ Key Features

* No floorplans or 3D models are needed – just draw your home in the dashboard

* Add devices visually – place them where they are located in real life

* Multi-floor support – model your home floor by floor

* Live electricity usage graphs – compare your usage with your neighbors

* Custom 3D UI – control your smart devices in a visual way

## ✅ Requirements
- [Home Assistant](https://github.com/home-assistant) set up and running
- [Node.js](https://github.com/nodejs/node) (for building custom cards)
- (Optional) [Docker Compose](https://github.com/docker/compose)

## 🛠️ Installation

#### 1. Clone the repo
```bash
git clone git@github.com:TPO-2024-2025/DrawMyRoom.git
```

#### 2. Fix the domain name and build the cards
```bash
cd DrawMyRoom/src
```
##### 2.1 Run the script
The script will automatically update your domain name.
```bash
./deploy.sh
```
> ⚠️ *When prompted, enter your domain name. Example: kuscarcek.si* 

#### 3. Move folders
After a successful build, please move homeassistant/config into /config and homeassistnat/code into /config/www.

```bash
cp /homeassistant/code -r /path/to/config/www
cp /homeassistant/config -r /path/to/config
```

#### 4. Check status
Visit your domain, and it should be working. You should see a dashboard like the [kuscarcek.si](https://kuscarcek.si/), accessible with the credentials <details><summary>Show credentials</summary>  
> Username: demo 
> Password: demo  
</details>

#### 5. Usage
The dashboard is quite intuitive. If not, please watch this demo video.
> [📺 Absolute cinema🍿](https://youtu.be/tSYQr0QapdU)

### 🐳 Docker Compose integration (Optional)
You can integrate DrawMyRoom into your existing Docker Compose setup (e.g. with NGINX or Home Assistant containers). We provide an example compose.yml in src folder.

## 🤝 Contributing
We welcome contributions! Feel free to:

- Open pull requests
- Submit issues
- Suggest features

Please make sure your code follows our basic guidelines and is respectful to others. Before proceeding please read [CODE OF CONDUCT](CODE_OF_CONDUCT.md).

## 😈🔐 Security Vulnerabilities

We take security seriously. If you discover a vulnerability, we appreciate your help in disclosing it responsibly.  
Please refer to our [SECURITY](SECURITY) policy for guidelines on how to report issues.


## License

This project is licensed under the GNU General Public License v3.0. See the [LICENSE](LICENSE) file for details.
