import os

def create_directories_and_files(base_path, structure):
    for folder, files in structure.items():
        folder_path = os.path.join(base_path, folder)
        os.makedirs(folder_path, exist_ok=True)
        for file_name, content in files.items():
            file_path = os.path.join(folder_path, file_name)
            with open(file_path, 'w', encoding='utf-8') as file:
                file.write(content)

if __name__ == "__main__":
    base_path = "D:\\WorkSpace\\githubApp\\webdriver\\copilot-web-demo\\static\\pages"  # Change this path as needed
    structure = {
        "Minimalism": {
            "index.html": "This is file1 in folder2.",
        },
        "MaterialDesign": {
            "index.html": "This is file1 in folder2.",
        },
        "FlatDesign": {
            "index.html": "This is file1 in folder2.",
        },
        "Neumorphism": {
            "index.html": "This is file1 in folder2.",
        },
        "Brutalism": {
            "index.html": "This is file1 in folder2.",
        },
        "Retro": {
            "index.html": "This is file1 in folder2.",
        },
        "Modernism": {
            "index.html": "This is file1 in folder2.",
        },
        "Postmodernism": {
            "index.html": "This is file1 in folder2.",
        },
        "OrganicDesign": {
            "index.html": "This is file1 in folder2.",
        },
        "DarkModem": {
            "index.html": "This is file1 in folder2.",
        },
        "TypographyCentric": {
            "index.html": "This is file1 in folder2.",
        },
        "IllustrationCentric": {
            "index.html": "This is file1 in folder2.",
        },
        "SPA": {
            "index.html": "This is file1 in folder2.",
        },
        "GridDesign": {
            "index.html": "This is file1 in folder2.",
        },
        "AsymmetricalDesign": {
            "index.html": "This is file1 in folder2.",
        },
        "HeroImage": {
            "index.html": "This is file1 in folder2.",
        },
        #"folder3/subfolder": {
        #    "file1.txt": "This is file1 in subfolder of folder3."
        #}
    }

    create_directories_and_files(base_path, structure)
    print(f"Directories and files created under {base_path}")