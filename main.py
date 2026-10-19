"""Desktop Application Entry Point for OmniPic-Convert."""
import sys
import os

# Ensure project root is on sys.path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from src.ui.app import OmniPicApp

def main():
    app = OmniPicApp()
    app.mainloop()

if __name__ == "__main__":
    main()
